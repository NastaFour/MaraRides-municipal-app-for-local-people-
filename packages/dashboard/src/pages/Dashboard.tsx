// ============================================================
// Dashboard Page — packages/dashboard
// Métricas del día + Mapa en vivo (Fase 4 core deliverable)
// ============================================================

import { useEffect, useState } from 'react';
import { Activity, Users, CheckCircle, Clock } from 'lucide-react';
import { driversApi, tripsApi } from '../services/api';
import type { Driver, Trip } from '../services/api';
import { LiveMap } from '../components/maps/LiveMap';

interface Metrics {
  activeDrivers: number;
  onTripDrivers: number;
  completedToday: number;
  pendingTrips: number;
}

function computeMetrics(drivers: Driver[], trips: Trip[]): Metrics {
  const today = new Date().toDateString();
  return {
    activeDrivers: drivers.filter(d => d.status === 'ONLINE').length,
    onTripDrivers: drivers.filter(d => d.status === 'IN_TRIP').length,
    completedToday: trips.filter(
      t => t.status === 'COMPLETED' && new Date(t.completedAt ?? '').toDateString() === today
    ).length,
    pendingTrips: trips.filter(t => t.status === 'REQUESTED').length,
  };
}

const STAT_CARDS = (m: Metrics) => [
  { id: 'stat-available',  label: 'Conductores Disponibles', value: m.activeDrivers, icon: Users,       accent: 'var(--clr-accent)' },
  { id: 'stat-on-trip',    label: 'En Viaje Ahora',         value: m.onTripDrivers,  icon: Activity,    accent: 'var(--clr-cyan)' },
  { id: 'stat-completed',  label: 'Viajes Completados Hoy', value: m.completedToday, icon: CheckCircle, accent: 'var(--clr-accent)' },
  { id: 'stat-pending',    label: 'Solicitudes Pendientes', value: m.pendingTrips,   icon: Clock,       accent: 'var(--clr-warn)' },
];

export function Dashboard() {
  const [drivers, setDrivers]     = useState<Driver[]>([]);
  const [trips,   setTrips]       = useState<Trip[]>([]);
  const [loading, setLoading]     = useState(true);
  const [error,   setError]       = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    Promise.all([driversApi.getAll(), tripsApi.getAll()])
      .then(([d, t]) => { setDrivers(d); setTrips(t); })
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  const metrics = computeMetrics(drivers, trips);

  // Build initial driver locations for the map
  const initialLocations = drivers
    .filter(d => d.latitude != null && d.longitude != null)
    .map(d => ({
      driverId: d.id,
      lat: d.latitude!,
      lng: d.longitude!,
      status: d.status,
    }));

  return (
    <div className="flex flex-col h-full min-h-screen">
      {/* ── PAGE HEADER ── */}
      <header
        className="flex items-center justify-between px-8 py-5 border-b"
        style={{ borderColor: 'var(--clr-border)' }}
      >
        <div>
          <h1
            style={{
              fontFamily: 'Anton, sans-serif',
              fontSize: '1.6rem',
              letterSpacing: '0.06em',
              color: 'var(--clr-text)',
              lineHeight: 1,
            }}
          >
            MONITOR <span style={{ color: 'var(--clr-accent)' }}>MUNICIPAL</span>
          </h1>
          <p className="sys-id mt-1">// Panel de Administración — Vista General</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full animate-blink" style={{ background: 'var(--clr-accent)' }} />
          <span className="font-mono text-xs" style={{ color: 'var(--clr-accent)' }}>EN VIVO</span>
        </div>
      </header>

      <div className="flex-1 p-8 flex flex-col gap-6">
        {/* ── ERROR ── */}
        {error && (
          <div
            className="font-mono text-xs p-4"
            style={{ border: 'var(--border-danger)', color: 'var(--clr-danger)', background: 'rgba(255,51,0,0.06)' }}
          >
            ⚠ Error al cargar datos: {error}
          </div>
        )}

        {/* ── METRIC CARDS ── */}
        <section className="grid grid-cols-4 gap-4">
          {STAT_CARDS(metrics).map(({ id, label, value, icon: Icon, accent }) => (
            <div
              key={id}
              id={id}
              className="metric-card transition-shadow"
            >
              <div className="flex items-center justify-between mb-3">
                <span className="font-mono text-xs uppercase tracking-widest" style={{ color: 'var(--clr-muted)' }}>
                  {label}
                </span>
                <Icon size={14} style={{ color: accent }} />
              </div>
              <span
                style={{
                  fontFamily: 'Anton, sans-serif',
                  fontSize: '3rem',
                  lineHeight: 1,
                  color: loading ? 'var(--clr-muted)' : accent,
                  letterSpacing: '-0.02em',
                }}
              >
                {loading ? '—' : value}
              </span>
            </div>
          ))}
        </section>

        {/* ── LIVE MAP + RECENT TRIPS ── */}
        <section className="flex-1 grid grid-cols-[1fr_320px] gap-4 min-h-[480px]">
          {/* Map */}
          <div
            className="panel-accent overflow-hidden"
            style={{ minHeight: 420 }}
          >
            <div
              className="flex items-center justify-between px-4 py-2 border-b"
              style={{ borderColor: 'var(--clr-border)' }}
            >
              <span className="font-mono text-xs uppercase tracking-widest" style={{ color: 'var(--clr-muted)' }}>
                // Mapa en vivo — Conductores activos
              </span>
              <div className="flex items-center gap-4 font-mono text-xs" style={{ color: 'var(--clr-muted)' }}>
                <span><span style={{ color: 'var(--clr-accent)' }}>◆</span> Disponible</span>
                <span><span style={{ color: 'var(--clr-cyan)' }}>◆</span> En viaje</span>
                <span><span style={{ color: 'var(--clr-muted)' }}>◆</span> Offline</span>
              </div>
            </div>
            <div style={{ height: 'calc(100% - 40px)', minHeight: 380 }}>
              <LiveMap initialDrivers={initialLocations} height="100%" />
            </div>
          </div>

          {/* Recent trips sidebar */}
          <div className="panel-accent flex flex-col">
            <div
              className="px-4 py-2 border-b"
              style={{ borderColor: 'var(--clr-border)' }}
            >
              <span className="font-mono text-xs uppercase tracking-widest" style={{ color: 'var(--clr-muted)' }}>
                // Viajes Recientes
              </span>
            </div>
            <div className="flex-1 overflow-auto">
              {loading ? (
                <p className="font-mono text-xs p-4" style={{ color: 'var(--clr-muted)' }}>Cargando...</p>
              ) : trips.length === 0 ? (
                <p className="font-mono text-xs p-4" style={{ color: 'var(--clr-muted)' }}>Sin viajes registrados.</p>
              ) : (
                trips.slice(0, 20).map(trip => (
                  <div
                    key={trip.id}
                    className="px-4 py-3 border-b"
                    style={{ borderColor: 'var(--clr-border)' }}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-mono text-xs" style={{ color: 'var(--clr-text)' }}>
                        {trip.client.name}
                      </span>
                      <TripStatusBadge status={trip.status} />
                    </div>
                    <p className="font-mono text-xs" style={{ color: 'var(--clr-muted)', fontSize: 10 }}>
                      {trip.originAddress.slice(0, 26)}…
                    </p>
                  </div>
                ))
              )}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

function TripStatusBadge({ status }: { status: Trip['status'] }) {
  const map: Record<Trip['status'], { label: string; color: string }> = {
    REQUESTED:   { label: 'SOLI',  color: 'var(--clr-warn)' },
    ACCEPTED:    { label: 'ACEP',  color: 'var(--clr-cyan)' },
    IN_PROGRESS: { label: 'VIVO',  color: 'var(--clr-accent)' },
    COMPLETED:   { label: 'OK',    color: 'var(--clr-accent)' },
    CANCELLED:   { label: 'CANC',  color: 'var(--clr-danger)' },
  };
  const { label, color } = map[status as string] || { label: status || 'UNKNOWN', color: 'var(--clr-muted)' };
  return <span className="badge" style={{ color, borderColor: color, fontSize: 9 }}>{label}</span>;
}
