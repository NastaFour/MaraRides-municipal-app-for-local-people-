// ============================================================
// LiveMap — packages/dashboard
// Interactive Leaflet Map with Real-time GPS Mototaxi Tracking
// Redesigned with Refactoring UI & UI-UX Pro Max
// ============================================================

import { useEffect, useRef, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap, ZoomControl } from 'react-leaflet';
import L from 'leaflet';
import { useDriverLocations } from '../../hooks/useSocket';

// Fix Leaflet marker icons in Vite bundling
delete (L.Icon.Default.prototype as unknown as Record<string, unknown>)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl:       'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl:     'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

// Custom Mototaxi Marker Icon with Pulse
function createMototaxiIcon(status: string = 'ONLINE') {
  const isOnline = status === 'ONLINE' || status === 'AVAILABLE';
  const isInTrip = status === 'IN_TRIP' || status === 'ON_TRIP';
  
  const color = isInTrip ? '#38bdf8' : isOnline ? '#10b981' : '#64748b';
  const bgGlow = isInTrip ? 'rgba(56, 189, 248, 0.3)' : isOnline ? 'rgba(16, 185, 129, 0.3)' : 'transparent';

  return L.divIcon({
    className: 'custom-mototaxi-pin',
    html: `
      <div style="
        position: relative;
        width: 30px;
        height: 30px;
        display: flex;
        align-items: center;
        justify-content: center;
      ">
        <div style="
          position: absolute;
          width: 28px;
          height: 28px;
          border-radius: 50%;
          background: ${bgGlow};
          animation: ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite;
        "></div>
        <div style="
          width: 20px;
          height: 20px;
          border-radius: 50%;
          background: #0f172a;
          border: 2px solid ${color};
          box-shadow: 0 2px 6px rgba(0,0,0,0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          color: ${color};
          font-size: 10px;
          font-weight: bold;
        ">
          🏍
        </div>
      </div>
    `,
    iconSize: [30, 30],
    iconAnchor: [15, 15],
    popupAnchor: [0, -15],
  });
}

function FlyToDriver({ lat, lng }: { lat: number; lng: number }) {
  const map = useMap();
  useEffect(() => {
    map.flyTo([lat, lng], 14, { animate: true, duration: 1.2 });
  }, [lat, lng, map]);
  return null;
}

export interface DriverMarkerData {
  driverId: string;
  lat: number;
  lng: number;
  status?: string;
  driverName?: string;
}

interface LiveMapProps {
  initialDrivers?: DriverMarkerData[];
  initialLocations?: DriverMarkerData[];
  height?: string;
}

// Center of Mara Municipality, Zulia, Venezuela
const MUNICIPALITY_CENTER: [number, number] = [10.7289, -71.7456];

export function LiveMap({ initialDrivers, initialLocations, height = '100%' }: LiveMapProps) {
  const baseData = initialDrivers || initialLocations || [];

  const [drivers, setDrivers] = useState<Map<string, DriverMarkerData>>(
    () => new Map(baseData.map(d => [d.driverId, d]))
  );
  const hasFlewRef = useRef(false);

  // Sync initial list if it updates asynchronously
  useEffect(() => {
    if (baseData.length > 0) {
      setDrivers(prev => {
        const next = new Map(prev);
        baseData.forEach(d => {
          if (!next.has(d.driverId)) {
            next.set(d.driverId, d);
          }
        });
        return next;
      });
    }
  }, [baseData]);

  // Handle live incoming GPS telemetry
  const handleLocation = (payload: { driverId: string; lat: number; lng: number; status?: string }) => {
    if (!payload?.driverId || payload.lat == null || payload.lng == null) return;
    setDrivers(prev => {
      const next = new Map(prev);
      const existing = next.get(payload.driverId);
      next.set(payload.driverId, {
        ...existing,
        driverId: payload.driverId,
        lat: payload.lat,
        lng: payload.lng,
        status: payload.status ?? existing?.status ?? 'ONLINE',
      });
      return next;
    });
  };

  useDriverLocations(handleLocation);

  const driverList = Array.from(drivers.values()).filter(d => d.lat != null && d.lng != null);
  const firstOnline = driverList.find(d => d.status !== 'OFFLINE');

  const countAvailable = driverList.filter(d => d.status === 'ONLINE' || d.status === 'AVAILABLE').length;
  const countInTrip = driverList.filter(d => d.status === 'IN_TRIP' || d.status === 'ON_TRIP').length;

  return (
    <div style={{ height, width: '100%', position: 'relative' }}>
      {/* Live Status Overlay Pill */}
      <div className="absolute top-4 right-4 z-[1000] px-3.5 py-1.5 rounded-xl bg-slate-900/90 border border-slate-800 shadow-xl backdrop-blur-md flex items-center gap-3">
        <div className="flex items-center gap-1.5 text-xs">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-slate-300 font-semibold">{countAvailable}</span>
          <span className="text-slate-500">disponibles</span>
        </div>
        <span className="text-slate-700">|</span>
        <div className="flex items-center gap-1.5 text-xs">
          <span className="w-2 h-2 rounded-full bg-sky-400" />
          <span className="text-slate-300 font-semibold">{countInTrip}</span>
          <span className="text-slate-500">en viaje</span>
        </div>
      </div>

      <MapContainer
        center={firstOnline ? [firstOnline.lat, firstOnline.lng] : MUNICIPALITY_CENTER}
        zoom={13}
        style={{ height: '100%', width: '100%', background: '#0b0f17' }}
        zoomControl={false}
      >
        <ZoomControl position="bottomright" />
        <TileLayer
          attribution='&copy; <a href="https://osm.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {firstOnline && !hasFlewRef.current && (() => {
          hasFlewRef.current = true;
          return <FlyToDriver lat={firstOnline.lat} lng={firstOnline.lng} />;
        })()}

        {driverList.map(driver => (
          <Marker
            key={driver.driverId}
            position={[driver.lat, driver.lng]}
            icon={createMototaxiIcon(driver.status)}
          >
            <Popup>
              <div style={{ padding: '4px 2px', minWidth: 140 }}>
                <p style={{ margin: 0, fontWeight: 'bold', fontSize: 13, color: '#0f172a' }}>
                  {driver.driverName || 'Mototaxi'}
                </p>
                <p style={{ margin: '2px 0 0', fontSize: 11, color: '#64748b', fontFamily: 'monospace' }}>
                  ID: {driver.driverId.slice(0, 8)}
                </p>
                <div style={{ marginTop: 6, display: 'inline-block', padding: '2px 8px', borderRadius: 6, fontSize: 10, fontWeight: 'bold', background: driver.status === 'IN_TRIP' ? '#e0f2fe' : '#dcfce7', color: driver.status === 'IN_TRIP' ? '#0369a1' : '#15803d' }}>
                  {driver.status === 'IN_TRIP' ? 'EN RUTA' : 'DISPONIBLE'}
                </div>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}
