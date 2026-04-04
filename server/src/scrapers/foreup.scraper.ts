import { BaseScraper } from './base.scraper';
import { TeeTimeSlot, DateRange } from '../types';
import logger from '../logger';

const log = logger.child({ module: 'foreup-scraper' });

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
    const urlParts = this.parseBookingUrl(courseUrl);
    const courseId = (scraperConfig?.course_id as string) ?? urlParts.courseId ?? '';
    const scheduleId = (scraperConfig?.schedule_id as string) ?? urlParts.scheduleId ?? '1';

    // Auto-detect booking class if not provided
    let bookingClass = scraperConfig?.booking_class as string | undefined;
    if (!bookingClass) {
      bookingClass = await this.fetchDefaultBookingClass(baseUrl, courseId, scheduleId);
    }

    const currentDate = new Date(dateRange.start);
    while (currentDate <= dateRange.end) {
      const dateStr = this.formatDate(currentDate);

      try {
        const url = new URL(`${baseUrl}/index.php/api/booking/times`);
        url.searchParams.set('date', dateStr);
        url.searchParams.set('time', 'all');
        url.searchParams.set('holes', 'all');
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
          log.warn({ dateStr, courseId, status: response.status }, 'foreUP API returned non-OK status');
          currentDate.setDate(currentDate.getDate() + 1);
          continue;
        }

        const data = await response.json();

        // API returns `false` for invalid course/schedule combos
        if (!Array.isArray(data)) {
          log.warn({ dateStr, courseId, scheduleId }, 'foreUP returned non-array response');
          currentDate.setDate(currentDate.getDate() + 1);
          continue;
        }

        for (const item of data as ForeupApiResponse[]) {
          const teeDateTime = new Date(item.time);
          const bookingDate = this.formatDate(teeDateTime);

          // Emit 18-hole slot if available
          const available18 = item.available_spots_18 ?? item.available_spots ?? 0;
          if (available18 >= numPlayers) {
            slots.push({
              courseId: courseId,
              dateTime: teeDateTime,
              numPlayersAvailable: available18,
              price: item.green_fee_18 ?? item.green_fee ?? 0,
              bookingUrl: `${baseUrl}/index.php/booking/${courseId}/${scheduleId}#/teetimes?date=${bookingDate}&time=all&holes=18&players=${numPlayers}`,
              platform: 'foreup',
              holes: 18,
            });
          }

          // Emit 9-hole slot if available
          const available9 = item.available_spots_9 ?? 0;
          if (available9 >= numPlayers) {
            slots.push({
              courseId: courseId,
              dateTime: teeDateTime,
              numPlayersAvailable: available9,
              price: item.green_fee_9 ?? item.green_fee ?? 0,
              bookingUrl: `${baseUrl}/index.php/booking/${courseId}/${scheduleId}#/teetimes?date=${bookingDate}&time=all&holes=9&players=${numPlayers}`,
              platform: 'foreup',
              holes: 9,
            });
          }
        }
      } catch (err) {
        log.error({ err, dateStr, courseId }, 'Error fetching foreUP slots');
      }

      currentDate.setDate(currentDate.getDate() + 1);
    }

    return slots;
  }

  private extractBaseUrl(courseUrl: string): string {
    const url = new URL(courseUrl);
    return `${url.protocol}//${url.host}`;
  }

  /** Fetch the booking page and extract the first active booking class ID */
  private async fetchDefaultBookingClass(baseUrl: string, courseId: string, scheduleId: string): Promise<string> {
    try {
      const response = await fetch(`${baseUrl}/index.php/booking/${courseId}/${scheduleId}`, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
        },
      });
      if (!response.ok) return 'false';

      const html = await response.text();
      // Extract booking_class_id, active, and block_online_booking from each class object
      // Using individual field extraction to avoid nested JSON parsing issues
      const classRegex = /"booking_class_id":"(\d+)"[^}]*?"active":"([01])"[^}]*?"block_online_booking":"([01])"/g;
      let classMatch;
      while ((classMatch = classRegex.exec(html)) !== null) {
        const [, classId, isActive, isBlocked] = classMatch;
        if (isActive === '1' && isBlocked === '0') {
          log.info({ courseId, bookingClass: classId }, 'Auto-detected booking class');
          return classId;
        }
      }
    } catch (err) {
      log.warn({ err, courseId }, 'Failed to auto-detect booking class');
    }
    return 'false';
  }

  /** Parse /index.php/booking/{courseId}/{scheduleId} from the booking URL */
  private parseBookingUrl(courseUrl: string): { courseId?: string; scheduleId?: string } {
    const match = courseUrl.match(/\/booking\/(\d+)\/(\d+)/);
    if (!match) return {};
    return { courseId: match[1], scheduleId: match[2] };
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
