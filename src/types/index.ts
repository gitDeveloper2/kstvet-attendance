export interface User {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'trainer' | 'trainee';
  created_at: string;
  updated_at: string;
}

export interface Unit {
  id: string;
  code: string;
  name: string;
  is_active: boolean;
  created_at: string;
}

export interface Venue {
  id: string;
  name: string;
  is_active: boolean;
  created_at: string;
}

export interface TrainerUnit {
  trainer_id: string;
  unit_id: string;
  created_at: string;
  trainer?: User;
  unit?: Unit;
}

export interface Location {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  radius: number; // in meters
  created_at: string;
  updated_at: string;
}

export interface Session {
  id: string;
  qr_token: string;
  location_id?: string | null;
  location_name?: string | null;
  unit_id?: string | null;
  venue_id?: string | null;
  lesson_number?: number | null;
  trainer_id: string;
  date: string;
  start_time: string;
  end_time: string;
  title: string;
  description?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  location?: Location;
  unit?: Unit;
  venue?: Venue;
  trainer?: User;
}

export interface Attendance {
  id: string;
  user_id: string;
  session_id: string;
  timestamp: string;
  latitude: number;
  longitude: number;
  verified: boolean;
  created_at: string;
  user?: User;
  session?: Session;
}

export interface CreateSessionData {
  title: string;
  description?: string;
  location_id?: string | null;
  location_name?: string | null;
  date: string;
  start_time: string;
  end_time: string;
}

export interface CreateLocationData {
  name: string;
  latitude: number;
  longitude: number;
  radius: number;
}

export interface MarkAttendanceData {
  session_id: string;
  qr_token: string;
  latitude: number;
  longitude: number;
}

export interface AttendanceReport {
  session: Session;
  attendees: (Attendance & { user: User })[];
  total_attendees: number;
  date: string;
}

export interface GPSPosition {
  latitude: number;
  longitude: number;
  accuracy?: number;
}

export interface QRScanResult {
  qr_token: string;
  session_id: string;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'trainer' | 'trainee';
}

export interface AttendanceFilters {
  date_from?: string;
  date_to?: string;
  session_id?: string;
  user_id?: string;
  verified_only?: boolean;
}
