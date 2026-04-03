import { TeeTimeSlot, DateRange } from '../types';

export abstract class BaseScraper {
  protected platform: string;

  constructor(platform: string) {
    this.platform = platform;
  }

  abstract getAvailableSlots(
    courseUrl: string,
    dateRange: DateRange,
    numPlayers: number,
    scraperConfig?: Record<string, unknown> | null
  ): Promise<TeeTimeSlot[]>;
}
