import { BaseScraper } from './base.scraper';
import { TeeTimeSlot, DateRange } from '../types';

/**
 * foreUP scraper — uses the public booking widget API at /index.php/api/booking/times
 * Used by many Utah municipal courses (Sleepy Ridge, Timpanogos, etc.)
 *
 * Key details:
 * - Requires api_key=no_limits (hard-coded public widget key)
 * - Date format must be M-D-YYYY (not YYYY-MM-DD)
 * - Needs x-requested-with: XMLHttpRequest header
 * - No auth needed for reading available times
 */
export class ForeupScraper extends BaseScraper {
  constructor() {
    super('foreup');
  }

  async getAvailableSlots(
    courseUrl: string,
    dateRange: DateRange,
    numPlayers: number,
    scraperConfig?: Record<string, unknown> | null
  ): Promise<TeeTimeSlot[]> {
    const slots: TeeTimeSlot[] = [];
    const baseUrl = this.extractBaseUrl(courseUrl);
    const scheduleId = (scraperConfig?.schedule_id as string) ?? '1';
    const courseId = (scraperConfig?.course_id as string) ?? '';
    const bookingClass = (scraperConfig?.booking_class as string) ?? 'false';

    const currentDate = new Date(dateRange.start);
    while (currentDate <= dateRange.end) {
      const dateStr = this.formatDate(currentDate);

      try {
        const url = new URL(`${baseUrl}/index.php/api/booking/times`);
        url.searchParams.set('date', dateStr);
        url.searchParams.set('time', 'all');
        url.searchParams.set('holes', '18');
        url.searchParams.set('players', numPlayers.toString());
        url.searchParams.set('booking_class', bookingClass);
        url.searchParams.set('schedule_id', scheduleId);
        url.searchParams.set('specials_only', '0');
        url.searchParams.set('api_key', 'no_limits');

        const response = await fetch(url.toString(), {
          headers: {
            'Accept': 'application/json, text/javascript, */*; q=0.01',
            'x-requested-with': 'XMLHttpRequest',
            'Referer': courseUrl,
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
          },
        });

        if (!response.ok) {
          console.warn(`foreUP API returned ${response.status} for ${dateStr}`);
          currentDate.setDate(currentDate.getDate() + 1);
          continue;
        }

        const data = await response.json();

        // API returns `false` for invalid course/schedule combos
        if (!Array.isArray(data)) {
          console.warn(`foreUP returned non-array for ${dateStr} (schedule ${scheduleId})`);
          currentDate.setDate(currentDate.getDate() + 1);
          continue;
        }

        for (const item of data as ForeupApiResponse[]) {
          const available = item.available_spots ?? item.available_spots_18 ?? 0;
          if (available < numPlayers) continue;

          const teeDateTime = new Date(item.time);
          const bookingDate = this.formatDate(teeDateTime);
          slots.push({
            courseId: courseId,
            dateTime: teeDateTime,
            numPlayersAvailable: available,
            price: item.green_fee_18 ?? item.green_fee ?? 0,
            bookingUrl: `${baseUrl}/index.php/booking/${courseId}/${scheduleId}#/teetimes?date=${bookingDate}&time=all&holes=18&players=${numPlayers}`,
            platform: 'foreup',
          });
        }
      } catch (err) {
        console.error(`Error fetching foreUP slots for ${dateStr}:`, err);
      }

      currentDate.setDate(currentDate.getDate() + 1);
    }

    return slots;
  }

  private extractBaseUrl(courseUrl: string): string {
    const url = new URL(courseUrl);
    return `${url.protocol}//${url.host}`;
  }

  /** foreUP expects M-D-YYYY (no zero-padding) */
  private formatDate(date: Date): string {
    const m = date.getMonth() + 1;
    const d = date.getDate();
    const y = date.getFullYear();
    return `${m}-${d}-${y}`;
  }
}

interface ForeupApiResponse {
  time: string;
  available_spots: number;
  available_spots_9: number;
  available_spots_18: number;
  green_fee: number;
  green_fee_9: number;
  green_fee_18: number;
  cart_fee: number;
  cart_fee_18: number;
  course_id: number;
  course_name: string;
  schedule_id: number;
  schedule_name: string;
  holes: number;
}
