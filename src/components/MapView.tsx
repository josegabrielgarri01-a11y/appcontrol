import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import type { LocationLog } from '@/types';

interface MapViewProps {
  locations: LocationLog[];
  deviceLocked: boolean;
}

export function MapView({ locations, deviceLocked }: MapViewProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<L.Map | null>(null);
  const markersRef = useRef<L.CircleMarker[]>([]);

  useEffect(() => {
    if (!mapRef.current || mapInstance.current) return;

    const lastLoc = locations[locations.length - 1];
    const center: [number, number] = lastLoc
      ? [lastLoc.lat, lastLoc.lng]
      : [0, 0];

    mapInstance.current = L.map(mapRef.current).setView(center, 15);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: 'OpenStreetMap',
      maxZoom: 19,
    }).addTo(mapInstance.current);
  }, []);

  useEffect(() => {
    const map = mapInstance.current;
    if (!map) return;

    markersRef.current.forEach((m) => m.remove());
    markersRef.current = [];

    locations.forEach((loc, idx) => {
      const isLast = idx === locations.length - 1;
      const color = isLast ? '#ef4444' : '#3b82f6';
      const marker = L.circleMarker([loc.lat, loc.lng], {
        radius: isLast ? 8 : 5,
        fillColor: color,
        color: '#fff',
        weight: 2,
        fillOpacity: 0.9,
      }).addTo(map);

      marker.bindPopup(
        `<div style="font-size:12px">
          <strong>${isLast ? 'Ubicación actual' : 'Punto ' + (idx + 1)}</strong><br/>
          Lat: ${loc.lat.toFixed(5)}<br/>
          Lng: ${loc.lng.toFixed(5)}<br/>
          Hora: ${new Date(loc.timestamp).toLocaleString('es-ES')}
        </div>`,
      );
      markersRef.current.push(marker);
    });

    if (locations.length > 0) {
      const last = locations[locations.length - 1];
      map.setView([last.lat, last.lng], 15, { animate: true });
    }
  }, [locations]);

  return (
    <div className="relative w-full overflow-hidden rounded-2xl ring-1 ring-slate-200">
      <div ref={mapRef} className="h-[400px] w-full" />
      {deviceLocked && (
        <div className="absolute right-3 top-3 flex items-center gap-2 rounded-full bg-red-500 px-4 py-2 text-xs font-semibold text-white shadow-lg">
          <span className="h-2 w-2 animate-pulse rounded-full bg-white" />
          Bloqueado
        </div>
      )}
    </div>
  );
}
