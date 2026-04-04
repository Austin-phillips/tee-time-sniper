import { BaseScraper } from './base.scraper';
import { TeeTimeSlot, DateRange } from '../types';
import logger from '../logger';

const log = logger.child({ module: 'custom-scraper' });

/**
 * Fallback generic scraper using Playwright for unknown platforms
 */
export class CustomScraper extends BaseScraper {
  constructor() {
    super('custom');
  }

  async getAvailableSlots(
    courseUrl: string,
    dateRange: DateRange,
    numPlayers: number,
    _scraperConfig?: Record<string, unknown> | null
  ): Promise<TeeTimeSlot[]> {
    // TODO: Implement generic Playwright-based scraper
    log.warn('Custom scraper not yet implemented');
    return [];
  }
}
