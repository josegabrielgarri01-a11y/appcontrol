import { db } from '@/firebase/config';
import {
  collection,
  addDoc,
  serverTimestamp,
  query,
  where,
  getDocs,
  doc,
  updateDoc,
} from 'firebase/firestore';
import type { LocationLog } from '@/types';
import { getDeviceId } from './device';

const PENDING_KEY = 'pc_pending_locations';

export function savePendingLocation(lat: number, lng: number): void {
  const pending: LocationLog[] = JSON.parse(localStorage.getItem(PENDING_KEY) || '[]');
  pending.push({
    device_id: getDeviceId(),
    lat,
    lng,
    timestamp: Date.now(),
    synced: false,
  });
  localStorage.setItem(PENDING_KEY, JSON.stringify(pending));
}

export function getPendingLocations(): LocationLog[] {
  return JSON.parse(localStorage.getItem(PENDING_KEY) || '[]');
}

export function clearPendingLocations(): void {
  localStorage.removeItem(PENDING_KEY);
}

export async function uploadPendingLocations(): Promise<number> {
  const pending = getPendingLocations();
  if (pending.length === 0) return 0;

  for (const loc of pending) {
    await addDoc(collection(db, 'location_logs'), {
      device_id: loc.device_id,
      lat: loc.lat,
      lng: loc.lng,
      timestamp: loc.timestamp,
      synced: true,
      created_at: serverTimestamp(),
    });
  }
  clearPendingLocations();
  return pending.length;
}

export async function logLocation(lat: number, lng: number, online: boolean): Promise<void> {
  if (online) {
    try {
      await addDoc(collection(db, 'location_logs'), {
        device_id: getDeviceId(),
        lat,
        lng,
        timestamp: Date.now(),
        synced: true,
        created_at: serverTimestamp(),
      });
    } catch {
      savePendingLocation(lat, lng);
    }
  } else {
    savePendingLocation(lat, lng);
  }
}

export async function fetchLocations(deviceId: string, limitCount = 100): Promise<LocationLog[]> {
  const q = query(
    collection(db, 'location_logs'),
    where('device_id', '==', deviceId),
  );
  const snap = await getDocs(q);
  const results: LocationLog[] = [];
  snap.forEach((d) => {
    const data = d.data() as LocationLog;
    results.push({ ...data, id: d.id });
  });
  return results.slice(-limitCount);
}

/**
 * ============================================================
 *  SCRIPT PARA BORRAR REGISTROS DE GPS MAYORES A 15 DÍAS
 * ============================================================
 *
 *  Ejecuta este código en la consola de Firebase o en un
 *  Cloud Function programada (cron). Versión Firestore SDK:
 *
 *  const admin = require('firebase-admin');
 *  admin.initializeApp();
 *  const db = admin.firestore();
 *
 *  exports.deleteOldGpsLogs = functions.pubsub
 *    .schedule('every 24 hours')
 *    .onRun(async (context) => {
 *      const cutoff = Date.now() - 15 * 24 * 60 * 60 * 1000;
 *      const snap = await db.collection('location_logs')
 *        .where('timestamp', '<', cutoff)
 *        .get();
 *      const batch = db.batch();
 *      snap.docs.forEach((doc) => batch.delete(doc.ref));
 *      await batch.commit();
 *      console.log(`Deleted ${snap.size} old GPS logs`);
 *    });
 *
 *  Alternativa en consola del navegador (borrado manual):
 *
 *  const cutoff = Date.now() - 15 * 24 * 60 * 60 * 1000;
 *  const snap = await db.collection('location_logs')
 *    .where('timestamp', '<', cutoff).get();
 *  snap.forEach((doc) => doc.ref.delete());
 * ============================================================
 */
export async function deleteOldGpsLogs(days = 15): Promise<number> {
  const cutoff = Date.now() - days * 24 * 60 * 60 * 1000;
  const q = query(collection(db, 'location_logs'), where('timestamp', '<', cutoff));
  const snap = await getDocs(q);
  let count = 0;
  snap.forEach(async (d) => {
    await updateDoc(doc(db, 'location_logs', d.id), { deleted: true });
    count++;
  });
  return count;
}
