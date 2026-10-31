// ============================================================
// Dashboard Page — packages/dashboard
// Command Center: Daily Metrics + Live Real-time Mototaxi Map
// Redesigned with Refactoring UI & UI-UX Pro Max
// ============================================================

import { useEffect, useState } from 'react';
import {
  Activity,
  Users,
  CheckCircle2,
  Clock,
  ArrowUpRight,
  TrendingUp,
  RefreshCw,
  MapPin,
  Car,
} from 'lucide-react';
import { driversApi, tripsApi } from '../services/api';
import type { Driver, Trip } from '../services/api';
import { LiveMap } from '../components/maps/LiveMap';

interface Metrics {
  activeDrivers: number;
  onTripDrivers: number;
  completedToday: number;
  pendingTrips: number;
  totalEarnings: number;
}

function computeMetrics(drivers: Driver[], trips: Trip[]): Metrics {
  const today = new Date().toDateString();
  const completedTrips = trips.filter(
    t => t.status === 'COMPLETED' && new Date(t.completedAt ?? '').toDateString() === today
  );

  const earnings = completedTrips.reduce((acc, t) => acc + (t.fare ?? 0), 0);

  return {
    activeDrivers: drivers.filter(d => d.status === 'ONLINE').length,
    onTripDrivers: drivers.filter(d => d.status === 'IN_TRIP').length,
    completedToday: completedTrips.length,
    pendingTrips: trips.filter(t => t.status === 'REQUESTED').length,
    totalEarnings: Math.round(earnings * 100) / 100,
  };
}

export function Dashboard() {
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [trips, setTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = () => {
    setLoading(true);
    setError(null);
    Promise.all([driversApi.getAll(), tripsApi.getAll()])
      .then(([d, t]) => {
        setDrivers(d);
        setTrips(t);
      })
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchData();
  }, []);

  const metrics = computeMetrics(drivers, trips);

  // Build initial driver locations for the live tracking map
  const initialLocations = drivers
    .filter(d => d.latitude != null && d.longitude != null)
    .map(d => ({
      driverId: d.id,
      lat: d.latitude!,
      lng: d.longitude!,
    }));

  return (
    <div className="flex flex-col min-h-screen">
      {/* ── TOP HEADER ── */}
      <header
        className="flex items-center justify-between px-8 py-5 border-b"
        style={{ borderColor: 'var(--clr-border)', background: 'var(--clr-surface)' }}
      >
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
            <h1 className="text-xl font-bold text-white tracking-tight">Centro de Monitoreo Urbano</h1>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Supervisión en tiempo real de mototaxis y servicios en el municipio Mara
          </p>
        </div>

        <button
          onClick={fetchData}
          disabled={loading}
          className="btn-ghost"
        >
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          <span>Actualizar Datos</span>
        </button>
      </header>

      {/* ── CONTENT BODY ── */}
      <div className="p-8 space-y-6">
        {error && (
          <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm flex items-center justify-between">
            <span>⚠ {error}</span>
            <button onClick={fetchData} className="underline text-xs">Reintentar</button>
          </div>
        )}

        {/* ── METRIC STAT CARDS ── */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Disponibles */}
          <div className="panel p-5 relative overflow-hidden group">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Disponibles</span>
              <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-400">
                <Users size={16} />
              </div>
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-3xl font-extrabold text-white">{metrics.activeDrivers}</span>
              <span className="text-xs text-emerald-400 font-medium">Mototaxis online</span>
            </div>
          </div>

          {/* En Viaje */}
          <div className="panel p-5 relative overflow-hidden group">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">En Ruta Activa</span>
              <div className="w-8 h-8 rounded-lg bg-sky-500/10 flex items-center justify-center text-sky-400">
                <Activity size={16} />
              </div>
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-3xl font-extrabold text-white">{metrics.onTripDrivers}</span>
              <span className="text-xs text-sky-400 font-medium">Con pasajeros</span>
            </div>
          </div>

          {/* Solicitudes Pendientes */}
          <div className="panel p-5 relative overflow-hidden group">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Por Asignar</span>
              <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center text-amber-400">
                <Clock size={16} />
              </div>
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-3xl font-extrabold text-white">{metrics.pendingTrips}</span>
              <span className="text-xs text-amber-400 font-medium">Esperando chofer</span>
            </div>
          </div>

          {/* Completados Hoy */}
          <div className="panel p-5 relative overflow-hidden group">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Completados Hoy</span>
              <div className="w-8 h-8 rounded-lg bg-indigo-500/10 flex items-center justify-center text-indigo-400">
                <CheckCircle2 size={16} />
              </div>
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-3xl font-extrabold text-white">{metrics.completedToday}</span>
              <span className="text-xs text-slate-400 font-medium">${metrics.totalEarnings} recaudados</span>
            </div>
          </div>
        </div>

        {/* ── LIVE MAP & RECENT TRIPS SPLIT ── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* MAPA PRINCIPAL (2 columnas) */}
          <div className="lg:col-span-2 panel overflow-hidden flex flex-col min-h-[500px]">
            <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <MapPin size={16} className="text-amber-500" />
                <h2 className="text-sm font-semibold text-white">Rastreo GPS en Vivo</h2>
              </div>
              <span className="text-xs text-slate-400">Actualización continua</span>
            </div>
            <div className="flex-1 w-full h-full min-h-[440px]">
              <LiveMap initialLocations={initialLocations} />
            </div>
          </div>

          {/* SOLICITUDES RECIENTES (1 columna) */}
          <div className="panel p-5 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <h3 className="text-sm font-semibold text-white">Actividad Reciente</h3>
                <span className="text-xs text-slate-400">{trips.length} registros</span>
              </div>

              <div className="divide-y divide-slate-800/60 mt-3 max-h-[420px] overflow-y-auto">
                {trips.slice(0, 6).map(trip => (
                  <div key={trip.id} className="py-3 flex flex-col gap-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-slate-200">
                        {trip.client?.name ?? 'Cliente'}
                      </span>
                      <span className="text-[11px] font-mono text-amber-400 font-bold">
                        ${trip.fare?.toFixed(2) ?? '0.00'}
                      </span>
                    </div>
                    <div className="text-xs text-slate-400 truncate">
                      📍 {trip.originAddress} → {trip.destinationAddress || (trip as any).destAddress}
                    </div>
                    <div className="flex items-center justify-between pt-1">
                      <span className="text-[10px] text-slate-500">
                        {new Date(trip.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                      <span
                        className="badge text-[10px]"
                        style={{
                          color: trip.status === 'COMPLETED' ? '#10b981' : trip.status === 'REQUESTED' ? '#f59e0b' : '#38bdf8',
                        }}
                      >
                        {trip.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-4 border-t border-slate-800 flex justify-end">
              <a href="/trips" className="text-xs text-amber-500 hover:text-amber-400 flex items-center gap-1 font-medium">
                Ver todo el historial <ArrowUpRight size={13} />
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
