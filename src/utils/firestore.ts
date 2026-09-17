import { db } from '@/firebase/config';
import {
  collection,
  query,
  where,
  getDocs,
  doc,
  setDoc,
  updateDoc,
  onSnapshot,
  addDoc,
  serverTimestamp,
  getDoc,
} from 'firebase/firestore';
import type { License, Device, LinkedDevice } from '@/types';
import { getDeviceId, getTodayDateStr } from './device';

const ADMIN_SECRET = 'ADMIN-2026-SECRET';
const DEFAULT_PIN = '1234';

export function isAdminSecret(key: string): boolean {
  return key === ADMIN_SECRET;
}

function addDays(date: Date, days: number): string {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d.toISOString();
}

export function isLicenseExpired(expirationDate: string | null): boolean {
  if (!expirationDate) return false;
  return new Date() > new Date(expirationDate);
}

export async function validateLicense(key: string): Promise<License | null> {
  const q = query(collection(db, 'licenses'), where('key', '==', key));
  const snap = await getDocs(q);
  if (snap.empty) return null;

  const docSnap = snap.docs[0];
  const data = docSnap.data() as License;
  if (!data.is_active) return null;

  if (isLicenseExpired(data.expiration_date ?? null)) return null;

  const deviceId = getDeviceId();
  const linkedDevices = data.linked_devices ?? [];
  const maxDevices = data.max_devices ?? 4;

  const alreadyLinked = linkedDevices.some((d) => d.device_id === deviceId);
  if (!alreadyLinked) {
    if (linkedDevices.length >= maxDevices) return null;
    linkedDevices.push({
      device_id: deviceId,
      label: `Dispositivo ${linkedDevices.length + 1}`,
      linked_at: new Date().toISOString(),
    });
  }

  await updateDoc(doc(db, 'licenses', docSnap.id), {
    linked_devices: linkedDevices,
  });

  return { ...data, linked_devices: linkedDevices };
}

export async function fetchLicenseByKey(key: string): Promise<License | null> {
  const q = query(collection(db, 'licenses'), where('key', '==', key));
  const snap = await getDocs(q);
  if (snap.empty) return null;
  return { ...(snap.docs[0].data() as License) };
}

export async function registerClientData(
  key: string,
  parentName: string,
  childName: string,
): Promise<void> {
  const docRef = doc(db, 'licenses', key);
  const now = new Date();
  await setDoc(
    docRef,
    {
      key,
      parent_name: parentName,
      child_name: childName,
      activated_at: now.toISOString(),
      expiration_date: addDays(now, 30),
      admin_pin: DEFAULT_PIN,
      is_active: true,
      max_devices: 4,
      linked_devices: [],
    },
    { merge: true },
  );
}

export async function updateAdminPin(key: string, newPin: string): Promise<void> {
  const q = query(collection(db, 'licenses'), where('key', '==', key));
  const snap = await getDocs(q);
  if (snap.empty) return;
  await updateDoc(doc(db, 'licenses', snap.docs[0].id), { admin_pin: newPin });
}

export async function renewLicense(licenseId: string, extraDays: number): Promise<void> {
  const docRef = doc(db, 'licenses', licenseId);
  const snap = await getDoc(docRef);
  if (!snap.exists()) return;
  const data = snap.data() as License;
  const base = data.expiration_date ? new Date(data.expiration_date) : new Date();
  const newDate = base > new Date() ? addDays(base, extraDays) : addDays(new Date(), extraDays);
  await updateDoc(docRef, { expiration_date: newDate, is_active: true });
}

export async function registerDevice(): Promise<Device> {
  const deviceId = getDeviceId();
  const deviceRef = doc(db, 'devices', deviceId);
  const existingSnap = await getDoc(deviceRef);

  if (existingSnap.exists()) {
    return { ...(existingSnap.data() as Device), device_id: deviceId };
  }

  const newDevice: Device = {
    device_id: deviceId,
    max_daily_hours: 4,
    is_locked: false,
    daily_used_seconds: 0,
    last_reset_date: getTodayDateStr(),
    created_at: new Date().toISOString(),
  };

  await setDoc(deviceRef, newDevice);
  return newDevice;
}

export function watchDeviceLock(
  deviceId: string,
  callback: (device: Device) => void,
): () => void {
  const q = query(collection(db, 'devices'), where('device_id', '==', deviceId));
  return onSnapshot(q, (snap) => {
    if (!snap.empty) {
      const data = snap.docs[0].data() as Device;
      callback({ ...data, device_id: deviceId });
    }
  });
}

export async function updateDeviceLock(deviceId: string, isLocked: boolean): Promise<void> {
  const q = query(collection(db, 'devices'), where('device_id', '==', deviceId));
  const snap = await getDocs(q);
  if (!snap.empty) {
    await updateDoc(doc(db, 'devices', snap.docs[0].id), { is_locked: isLocked });
  }
}

export async function updateMaxDailyHours(deviceId: string, hours: number): Promise<void> {
  const q = query(collection(db, 'devices'), where('device_id', '==', deviceId));
  const snap = await getDocs(q);
  if (!snap.empty) {
    await updateDoc(doc(db, 'devices', snap.docs[0].id), { max_daily_hours: hours });
  }
}

export async function fetchDevice(deviceId: string): Promise<Device | null> {
  const q = query(collection(db, 'devices'), where('device_id', '==', deviceId));
  const snap = await getDocs(q);
  if (snap.empty) return null;
  return { ...(snap.docs[0].data() as Device), device_id: deviceId };
}

export async function updateDailyUsage(deviceId: string, usedSeconds: number): Promise<void> {
  const q = query(collection(db, 'devices'), where('device_id', '==', deviceId));
  const snap = await getDocs(q);
  if (!snap.empty) {
    const today = getTodayDateStr();
    const data = snap.docs[0].data() as Device;
    const resetSeconds = data.last_reset_date !== today ? 0 : data.daily_used_seconds;
    await updateDoc(doc(db, 'devices', snap.docs[0].id), {
      daily_used_seconds: resetSeconds + usedSeconds,
      last_reset_date: today,
    });
  }
}

export async function generateLicenses(count: number): Promise<number> {
  let created = 0;
  for (let i = 1; i <= count; i++) {
    const key = `PADRE-${String(i).padStart(3, '0')}`;
    const q = query(collection(db, 'licenses'), where('key', '==', key));
    const existing = await getDocs(q);
    if (!existing.empty) continue;

    await addDoc(collection(db, 'licenses'), {
      key,
      is_active: true,
      max_devices: 4,
      linked_devices: [],
      created_at: serverTimestamp(),
      parent_name: null,
      child_name: null,
      activated_at: null,
      expiration_date: null,
      admin_pin: null,
    });
    created++;
  }
  return created;
}

export async function fetchAllLicenses(): Promise<(License & { id: string })[]> {
  const snap = await getDocs(collection(db, 'licenses'));
  const results: (License & { id: string })[] = [];
  snap.forEach((d) => {
    results.push({ ...(d.data() as License), id: d.id });
  });
  return results.sort((a, b) => a.key.localeCompare(b.key));
}

export async function toggleLicenseActive(licenseId: string, isActive: boolean): Promise<void> {
  await updateDoc(doc(db, 'licenses', licenseId), { is_active: isActive });
}

export async function linkDeviceToLicense(
  licenseKey: string,
  deviceId: string,
  label: string,
): Promise<boolean> {
  const q = query(collection(db, 'licenses'), where('key', '==', licenseKey));
  const snap = await getDocs(q);
  if (snap.empty) return false;

  const docSnap = snap.docs[0];
  const data = docSnap.data() as License;
  if (!data.is_active) return false;

  const linkedDevices: LinkedDevice[] = data.linked_devices ?? [];
  if (linkedDevices.some((d) => d.device_id === deviceId)) return true;
  if (linkedDevices.length >= (data.max_devices ?? 4)) return false;

  linkedDevices.push({
    device_id: deviceId,
    label,
    linked_at: new Date().toISOString(),
  });

  await updateDoc(doc(db, 'licenses', docSnap.id), { linked_devices: linkedDevices });
  return true;
}

export function watchLicenses(callback: (licenses: (License & { id: string })[]) => void): () => void {
  return onSnapshot(collection(db, 'licenses'), (snap) => {
    const results: (License & { id: string })[] = [];
    snap.forEach((d) => {
      results.push({ ...(d.data() as License), id: d.id });
    });
    callback(results.sort((a, b) => a.key.localeCompare(b.key)));
  });
}
