// ============================================================
// MapPage — packages/dashboard
// Página dedicada: Mapa en vivo a pantalla completa
// ============================================================

import { useEffect, useState } from 'react';
import { driversApi } from '../services/api';
import type { Driver } from '../services/api';
import { LiveMap } from '../components/maps/LiveMap';

export function MapPage() {
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    driversApi.getAll()
      .then(setDrivers)
      .finally(() => setLoading(false));
  }, []);

  const initialLocations = drivers
    .filter(d => d.latitude != null && d.longitude != null)
    .map(d => ({ driverId: d.id, lat: d.latitude!, lng: d.longitude!, status: d.status }));

  const online   = drivers.filter(d => d.status !== 'OFFLINE').length;
  const onTrip   = drivers.filter(d => d.status === 'ON_TRIP').length;
  const avail    = drivers.filter(d => d.status === 'AVAILABLE').length;

  return (
    <div className="flex flex-col" style={{ height: '100vh' }}>
      {/* ── HEADER ── */}
      <header
        className="flex items-center justify-between px-8 py-4 border-b flex-shrink-0"
        style={{ borderColor: 'var(--clr-border)' }}
      >
        <div>
          <h1
            style={{
              fontFamily: 'Anton, sans-serif',
              fontSize: '1.4rem',
              letterSpacing: '0.06em',
              color: 'var(--clr-text)',
              lineHeight: 1,
            }}
          >
            MAPA <span style={{ color: 'var(--clr-accent)' }}>EN VIVO</span>
          </h1>
          <p className="sys-id mt-1">// Tracking GPS en tiempo real — Socket.io</p>
        </div>

        {/* Stats strip */}
        <div className="flex items-center gap-6">
          {[
            { label: 'ONLINE',     value: online, color: 'var(--clr-accent)' },
            { label: 'EN VIAJE',   value: onTrip, color: 'var(--clr-cyan)' },
            { label: 'DISPONIBLE', value: avail,  color: 'var(--clr-accent)' },
          ].map(({ label, value, color }) => (
            <div key={label} className="text-right">
              <div
                style={{
                  fontFamily: 'Anton, sans-serif',
                  fontSize: '1.8rem',
                  color: loading ? 'var(--clr-muted)' : color,
                  lineHeight: 1,
                }}
              >
                {loading ? '—' : value}
              </div>
              <div className="sys-id">{label}</div>
            </div>
          ))}

          {/* Live indicator */}
          <div
            className="flex items-center gap-2 px-4 py-2 border"
            style={{ borderColor: 'var(--clr-accent)', background: 'rgba(204,255,0,0.05)' }}
          >
            <span className="w-2 h-2 rounded-full animate-blink" style={{ background: 'var(--clr-accent)' }} />
            <span className="font-mono text-xs" style={{ color: 'var(--clr-accent)' }}>EN VIVO</span>
          </div>
        </div>
      </header>

      {/* ── MAP (fills remaining space) ── */}
      <div className="flex-1" style={{ minHeight: 0 }}>
        <LiveMap initialDrivers={initialLocations} height="100%" />
      </div>

      {/* ── LEGEND footer ── */}
      <footer
        className="flex items-center gap-8 px-8 py-3 border-t flex-shrink-0"
        style={{ borderColor: 'var(--clr-border)', background: 'var(--clr-surface)' }}
      >
        <span className="sys-id">LEYENDA:</span>
        {[
          { color: 'var(--clr-accent)', label: 'Disponible' },
          { color: 'var(--clr-cyan)',   label: 'En Viaje' },
          { color: 'var(--clr-muted)',  label: 'Offline' },
        ].map(({ color, label }) => (
          <div key={label} className="flex items-center gap-2">
            <div
              style={{
                width: 10, height: 10,
                background: color,
                transform: 'rotate(45deg)',
                boxShadow: `0 0 6px ${color}`,
              }}
            />
            <span className="font-mono text-xs" style={{ color: 'var(--clr-muted)' }}>{label}</span>
          </div>
        ))}
        <span className="sys-id ml-auto">TILES: OpenStreetMap · PROJ: WGS84</span>
      </footer>
    </div>
  );
}
