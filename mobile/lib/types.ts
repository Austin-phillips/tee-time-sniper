export interface TeeTimeSlot {
  courseId: string;
  dateTime: Date;
  numPlayersAvailable: number;
  price: number;
  bookingUrl: string;
  platform: string;
}

export interface DateRange {
  start: Date;
  end: Date;
}

export interface Course {
  id: string;
  name: string;
  booking_platform: "foreup" | "ezlinks" | "golfnow" | "custom";
  booking_url: string;
  scraper_config: Record<string, unknown> | null;
}

export interface Preference {
  id: string;
  user_id: string;
  course_id: string;
  days_of_week: number[];
  earliest_time: string; // HH:MM:SS
  latest_time: string; // HH:MM:SS
  num_players: number;
  look_ahead_days: number;
  active: boolean;
}

export interface User {
  id: string;
  email: string;
  phone: string | null;
}

export interface AlertedSlot {
  id: string;
  course_id: string;
  tee_time: string;
  num_players: number;
  alerted_at: string;
  booked: boolean;
}
