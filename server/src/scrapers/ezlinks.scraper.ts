import { BaseScraper } from './base.scraper';
import { TeeTimeSlot, DateRange } from '../types';
import logger from '../logger';

const log = logger.child({ module: 'ezlinks-scraper' });

/**
 * EZLinks scraper — used by some Salt Lake County courses
 * Uses Playwright for browser automation since EZLinks doesn't expose a clean API
 */
export class EzlinksScraper extends BaseScraper {
  constructor() {
    super('ezlinks');
  }

  async getAvailableSlots(
    courseUrl: string,
    dateRange: DateRange,
    numPlayers: number,
    _scraperConfig?: Record<string, unknown> | null
  ): Promise<TeeTimeSlot[]> {
    // TODO: Implement EZLinks scraper using Playwright
    // EZLinks sites typically require browser automation
    log.warn('EZLinks scraper not yet implemented');
    return [];
  }
}
