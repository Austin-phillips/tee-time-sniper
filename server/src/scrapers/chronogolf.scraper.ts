import { ProxyAgent } from 'undici';
import { BaseScraper } from './base.scraper';
import { TeeTimeSlot, DateRange } from '../types';

/**
 * Chronogolf (Lightspeed Golf) scraper
 * Uses the public marketplace teetimes API — no auth required.
 *
 * Booking URLs: https://www.chronogolf.com/club/{slug}
 * API endpoint: GET /marketplace/clubs/{clubId}/teetimes?date=YYYY-MM-DD&affiliation_type_ids[]={id}
 *
 * Club metadata (clubId, affiliationTypeId) is extracted from the __NEXT_DATA__
 * script tag on the club page, or from scraper_config if provided.
 *
 * Requests are routed through PROXY_URL if set (Cloudflare blocks datacenter IPs).
 * All dates are fetched in parallel for speed.
 */
export class ChronogolfScraper extends BaseScraper {
  private dispatcher: ProxyAgent | undefined;

  constructor() {
    super('chronogolf');
    const proxyUrl = process.env.PROXY_URL;
    if (proxyUrl) {
      this.dispatcher = new ProxyAgent(proxyUrl);
    }
  }

  private async proxyFetch(url: string, options: RequestInit = {}): Promise<Response> {
    return fetch(url, {
      ...options,
      signal: AbortSignal.timeout(15000),
      ...(this.dispatcher ? { dispatcher: this.dispatcher as any } : {}),
    });
  }

  async getAvailableSlots(
    courseUrl: string,
    dateRange: DateRange,
    numPlayers: number,
    scraperConfig?: Record<string, unknown> | null
  ): Promise<TeeTimeSlot[]> {
    let clubId = scraperConfig?.club_id as number | undefined;
    let affiliationTypeId = scraperConfig?.affiliation_type_id as number | undefined;

    if (!clubId || !affiliationTypeId) {
      const slug = this.extractSlug(courseUrl);
      const meta = await this.fetchClubMetadata(slug);
      clubId = meta.clubId;
      affiliationTypeId = meta.affiliationTypeId;
    }

    // Build list of dates to fetch
    const dates: string[] = [];
    const currentDate = new Date(dateRange.start);
    while (currentDate <= dateRange.end) {
      dates.push(this.formatDate(currentDate));
      currentDate.setDate(currentDate.getDate() + 1);
    }

    // Fetch all dates in parallel
    const results = await Promise.allSettled(
      dates.map((dateStr) => this.fetchDate(clubId!, affiliationTypeId!, dateStr, courseUrl))
    );

    const slots: TeeTimeSlot[] = [];
    for (const result of results) {
      if (result.status === 'fulfilled') {
        slots.push(...result.value);
      }
    }

    return slots;
  }

  private async fetchDate(
    clubId: number,
    affiliationTypeId: number,
    dateStr: string,
    courseUrl: string
  ): Promise<TeeTimeSlot[]> {
    const params = new URLSearchParams();
    params.set('date', dateStr);
    params.append('affiliation_type_ids[]', String(affiliationTypeId));
    params.set('nb_holes', '18');

    const url = `https://www.chronogolf.com/marketplace/clubs/${clubId}/teetimes?${params}`;

    const response = await this.proxyFetch(url, {
      headers: {
        'Accept': 'application/json, text/plain, */*',
        'Accept-Language': 'en-US,en;q=0.9',
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache',
        'Referer': courseUrl,
        'Origin': 'https://www.chronogolf.com',
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
      },
    });

    if (!response.ok) {
      console.warn(`Chronogolf API returned ${response.status} for ${dateStr}`);
      return [];
    }

    const data = (await response.json()) as ChronogolfTeeTime[];
    const slots: TeeTimeSlot[] = [];

    for (const item of data) {
      if (item.out_of_capacity) continue;
      if (item.restrictions.length > 0) continue;
      if (!item.green_fees || item.green_fees.length === 0) continue;

      const dateTime = new Date(`${item.date}T${item.start_time}:00`);
      const price = item.green_fees[0]?.price ?? 0;

      slots.push({
        courseId: '',
        dateTime,
        numPlayersAvailable: 4,
        price,
        bookingUrl: courseUrl,
        platform: 'chronogolf',
      });
    }

    return slots;
  }

  private extractSlug(courseUrl: string): string {
    const url = new URL(courseUrl);
    const parts = url.pathname.split('/').filter(Boolean);
    return parts[parts.length - 1];
  }

  private async fetchClubMetadata(slug: string): Promise<{ clubId: number; affiliationTypeId: number }> {
    const response = await this.proxyFetch(`https://www.chronogolf.com/club/${slug}`, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch Chronogolf club page for ${slug}: ${response.status}`);
    }

    const html = await response.text();
    const match = html.match(/<script id="__NEXT_DATA__"[^>]*>(.*?)<\/script>/);
    if (!match) {
      throw new Error(`Could not find __NEXT_DATA__ on Chronogolf club page for ${slug}`);
    }

    const nextData = JSON.parse(match[1]);
    const club = nextData.props?.pageProps?.club;
    if (!club) {
      throw new Error(`Could not find club data in __NEXT_DATA__ for ${slug}`);
    }

    return {
      clubId: club.id,
      affiliationTypeId: club.defaultAffiliationTypeId,
    };
  }

  private formatDate(date: Date): string {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }
}

interface ChronogolfTeeTime {
  id: number;
  uuid: string;
  course_id: number;
  start_time: string;
  date: string;
  event_id: number | null;
  hole: number;
  round: number;
  format: string;
  departure: string | null;
  restrictions: string[];
  out_of_capacity: boolean;
  frozen: boolean;
  green_fees?: ChronogolfGreenFee[];
}

interface ChronogolfGreenFee {
  player_type_id: number;
  green_fee: number;
  half_cart: number;
  subtotal: number;
  teetime_id: number;
  affiliation_type_id: number;
  price: number;
  half_cart_price: number;
}
