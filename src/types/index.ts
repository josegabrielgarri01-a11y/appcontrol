export interface LinkedDevice {
  device_id: string;
  label: string;
  linked_at: string;
}

export interface License {
  key: string;
  is_active: boolean;
  max_devices: number;
  linked_devices: LinkedDevice[];
  created_at: string | null;
  parent_name: string | null;
  child_name: string | null;
  activated_at: string | null;
  expiration_date: string | null;
  admin_pin: string | null;
}

export interface Device {
  device_id: string;
  max_daily_hours: number;
  is_locked: boolean;
  daily_used_seconds: number;
  last_reset_date: string;
  created_at: string;
}

export interface LocationLog {
  id?: string;
  device_id: string;
  lat: number;
  lng: number;
  timestamp: number;
  synced: boolean;
}

export interface AppUsageEntry {
  id?: string;
  device_id: string;
  package_name: string;
  app_name: string;
  usage_seconds: number;
  date: string;
}

export type AppRole = 'child' | 'admin';
