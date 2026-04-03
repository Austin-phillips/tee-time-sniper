export interface TeeTimeSlot {
  courseId: string;
  dateTime: Date;
  numPlayersAvailable: number;
  price: number;
  bookingUrl: string;
  platform: string;
  holes: number;
}

export interface DateRange {
  start: Date;
  end: Date;
}

export interface Course {
  id: string;
  name: string;
  booking_platform: 'foreup' | 'ezlinks' | 'golfnow' | 'custom';
  booking_url: string;
  scraper_config: Record<string, unknown> | null;
}

export interface Preference {
  id: string;
  user_id: string;
  course_id: string;
  days_of_week: number[];
  earliest_time: string; // HH:MM:SS
  latest_time: string;   // HH:MM:SS
  num_players: number;
  look_ahead_days: number;
  holes: number; // 0 = both, 9 = 9 holes only, 18 = 18 holes only
  active: boolean;
}

export interface User {
  id: string;
  email: string;
  phone: string | null;
}

export interface MatchedTeeTime {
  id: string;
  user_id: string;
  preference_id: string;
  course_id: string;
  course_name: string;
  tee_time: string;
  players_available: number;
  price: number;
  booking_url: string;
  holes: number;
}
