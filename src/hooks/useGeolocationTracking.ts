import { useEffect, useRef, useState } from 'react';
import { logLocation, uploadPendingLocations } from '@/utils/offlineSync';
import { useOnlineStatus } from './useOnlineStatus';

interface Coords {
  lat: number;
  lng: number;
}

export function useGeolocationTracking(deviceId: string, active: boolean) {
  const [coords, setCoords] = useState<Coords | null>(null);
  const [error, setError] = useState<string | null>(null);
  const online = useOnlineStatus();
  const watchIdRef = useRef<number | null>(null);

  useEffect(() => {
    if (!active || !deviceId) return;

    if (!navigator.geolocation) {
      setError('Geolocalización no soportada en este dispositivo');
      return;
    }

    watchIdRef.current = navigator.geolocation.watchPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        setCoords({ lat: latitude, lng: longitude });
        logLocation(latitude, longitude, online).catch((e) =>
          setError(String(e)),
        );
      },
      (err) => setError(err.message),
      { enableHighAccuracy: true, maximumAge: 10000, timeout: 15000 },
    );

    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
    };
  }, [active, deviceId, online]);

  useEffect(() => {
    if (online && active) {
      uploadPendingLocations().catch((e) => setError(String(e)));
    }
  }, [online, active]);

  return { coords, error };
}
