import { useEffect, useState } from 'react';
import { watchDeviceLock } from '@/utils/firestore';
import type { Device } from '@/types';

export function useDeviceLock(deviceId: string | null) {
  const [device, setDevice] = useState<Device | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!deviceId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    const unsub = watchDeviceLock(deviceId, (d) => {
      setDevice(d);
      setLoading(false);
    });

    return () => unsub();
  }, [deviceId]);

  return { device, loading };
}
