import { db } from '@/firebase/config';
import { collection, addDoc, serverTimestamp, query, where, getDocs } from 'firebase/firestore';
import type { AppUsageEntry } from '@/types';
import { getDeviceId, getTodayDateStr } from './device';

const SAMPLE_APPS = [
  { package_name: 'com.dts.freefireth', app_name: 'Free Fire' },
  { package_name: 'com.android.chrome', app_name: 'Navegador Chrome' },
  { package_name: 'com.google.android.youtube', app_name: 'YouTube' },
  { package_name: 'com.whatsapp', app_name: 'WhatsApp' },
  { package_name: 'com.facebook.katana', app_name: 'Facebook' },
  { package_name: 'com.instagram.android', app_name: 'Instagram' },
  { package_name: 'com.tiktok', app_name: 'TikTok' },
];

export function simulateAppUsage(): { package_name: string; app_name: string; usage_seconds: number }[] {
  return SAMPLE_APPS.map((app) => ({
    ...app,
    usage_seconds: Math.floor(Math.random() * 7200) + 300,
  }));
}

export async function reportAppUsage(): Promise<void> {
  const deviceId = getDeviceId();
  const date = getTodayDateStr();
  const usage = simulateAppUsage();

  for (const entry of usage) {
    await addDoc(collection(db, 'app_usage'), {
      device_id: deviceId,
      package_name: entry.package_name,
      app_name: entry.app_name,
      usage_seconds: entry.usage_seconds,
      date,
      created_at: serverTimestamp(),
    });
  }
}

export async function fetchAppUsage(deviceId: string): Promise<AppUsageEntry[]> {
  const q = query(collection(db, 'app_usage'), where('device_id', '==', deviceId));
  const snap = await getDocs(q);
  const results: AppUsageEntry[] = [];
  snap.forEach((d) => {
    const data = d.data() as AppUsageEntry;
    results.push({ ...data, id: d.id });
  });

  const byApp = new Map<string, AppUsageEntry>();
  for (const entry of results) {
    const key = entry.package_name;
    if (byApp.has(key)) {
      byApp.get(key)!.usage_seconds += entry.usage_seconds;
    } else {
      byApp.set(key, { ...entry });
    }
  }
  return Array.from(byApp.values()).sort((a, b) => b.usage_seconds - a.usage_seconds);
}
