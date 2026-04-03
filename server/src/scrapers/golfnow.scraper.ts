import { BaseScraper } from './base.scraper';
import { TeeTimeSlot, DateRange } from '../types';

/**
 * GolfNow scraper — aggregator used by some private/resort courses
 */
export class GolfnowScraper extends BaseScraper {
  constructor() {
    super('golfnow');
  }

  async getAvailableSlots(
    courseUrl: string,
    dateRange: DateRange,
    numPlayers: number,
    _scraperConfig?: Record<string, unknown> | null
  ): Promise<TeeTimeSlot[]> {
    // TODO: Implement GolfNow scraper
    // GolfNow has an internal API that can be reverse-engineered from their booking flow
    console.warn('GolfNow scraper not yet implemented');
    return [];
  }
}
