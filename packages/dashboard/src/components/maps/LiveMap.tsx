// ============================================================
// LiveMap — packages/dashboard
// react-leaflet map with real-time driver markers via Socket.io
// Leaflet icon fix is applied here to avoid Vite asset issues
// ============================================================

import { useEffect, useRef, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import { useDriverLocations } from '../../hooks/useSocket';
import type { DriverLocationPayload } from '../../services/socket';

// ── Fix Leaflet default icon broken in Vite builds ──
delete (L.Icon.Default.prototype as unknown as Record<string, unknown>)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl:       'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl:     'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

// ── Custom neon driver icon ──
function makeDriverIcon(status: DriverLocationPayload['status']) {
  const colors: Record<DriverLocationPayload['status'], string> = {
    AVAILABLE: '#CCFF00',
    ON_TRIP:   '#00FFFF',
    OFFLINE:   '#666666',
  };
  const color = colors[status];
  return L.divIcon({
    className: '',
    html: `
      <div style="
        width: 12px;
        height: 12px;
        background: ${color};
        border: 2px solid #050505;
        box-shadow: 0 0 8px ${color};
        transform: rotate(45deg);
      "></div>
    `,
    iconSize:   [12, 12],
    iconAnchor: [6, 6],
  });
}

// ── Component to fly map to first driver location ──
function FlyToDriver({ lat, lng }: { lat: number; lng: number }) {
  const map = useMap();
  useEffect(() => {
    map.flyTo([lat, lng], map.getZoom(), { animate: true, duration: 1 });
  }, [lat, lng, map]);
  return null;
}

interface LiveMapProps {
  /** Initial driver locations from API (before socket updates) */
  initialDrivers?: DriverLocationPayload[];
  height?: string;
}

const MUNICIPALITY_CENTER: [number, number] = [10.0678, -69.3467]; // Barquisimeto default

export function LiveMap({ initialDrivers = [], height = '100%' }: LiveMapProps) {
  const [drivers, setDrivers] = useState<Map<string, DriverLocationPayload>>(
    () => new Map(initialDrivers.map(d => [d.driverId, d]))
  );
  const hasFlewRef = useRef(false);

  // ── Real-time socket updates ──
  const handleLocation = (payload: DriverLocationPayload) => {
    setDrivers(prev => {
      const next = new Map(prev);
      next.set(payload.driverId, payload);
      return next;
    });
  };
  useDriverLocations(handleLocation);

  const driverList = Array.from(drivers.values()).filter(
    d => d.lat != null && d.lng != null
  );

  const firstOnline = driverList.find(d => d.status !== 'OFFLINE');

  return (
    <div style={{ height, width: '100%', position: 'relative' }}>
      {/* Status overlay */}
      <div
        style={{
          position: 'absolute',
          top: 8,
          right: 8,
          zIndex: 1000,
          background: 'var(--clr-surface)',
          border: '1px solid var(--clr-border)',
          padding: '4px 10px',
        }}
      >
        <span className="font-mono text-xs" style={{ color: 'var(--clr-accent)' }}>
          {driverList.filter(d => d.status === 'AVAILABLE').length}
          <span style={{ color: 'var(--clr-muted)' }}> AVAIL / </span>
          {driverList.filter(d => d.status === 'ON_TRIP').length}
          <span style={{ color: 'var(--clr-muted)' }}> ON_TRIP</span>
        </span>
      </div>

      <MapContainer
        center={MUNICIPALITY_CENTER}
        zoom={14}
        style={{ height: '100%', width: '100%', background: '#050505' }}
        zoomControl={false}
      >
        <TileLayer
          attribution='&copy; <a href="https://osm.org/copyright">OSM</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {/* Fly to first online driver once */}
        {firstOnline && !hasFlewRef.current && (() => {
          hasFlewRef.current = true;
          return <FlyToDriver lat={firstOnline.lat} lng={firstOnline.lng} />;
        })()}

        {driverList.map(driver => (
          <Marker
            key={driver.driverId}
            position={[driver.lat, driver.lng]}
            icon={makeDriverIcon(driver.status)}
          >
            <Popup>
              <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 12, color: '#111' }}>
                <strong>ID:</strong> {driver.driverId.slice(0, 8)}<br />
                <strong>STATUS:</strong> {driver.status}
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}
