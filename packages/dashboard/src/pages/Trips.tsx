// ============================================================
// Trips Page — packages/dashboard
// Audit & Operations Log: Municipal Trips Registry
// Redesigned with Refactoring UI & UI-UX Pro Max
// ============================================================

import { useEffect, useState, useCallback, useMemo } from 'react';
import {
  RefreshCw,
  Calendar,
  Compass,
  Download,
  Search,
  CheckCircle2,
  Clock,
  Car,
  AlertTriangle,
} from 'lucide-react';
import { tripsApi } from '../services/api';
import type { Trip } from '../services/api';

type StatusFilter = 'ALL' | Trip['status'];

const STATUS_OPTIONS: StatusFilter[] = ['ALL', 'REQUESTED', 'ACCEPTED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'];

const STATUS_CONFIG: Record<string, { label: string; textClass: string; bgClass: string }> = {
  ALL:         { label: 'Todos',        textClass: 'text-slate-300', bgClass: 'bg-slate-800' },
  REQUESTED:   { label: 'Solicitado',   textClass: 'text-amber-400', bgClass: 'bg-amber-500/10 border-amber-500/30' },
  ACCEPTED:    { label: 'Aceptado',     textClass: 'text-sky-400',   bgClass: 'bg-sky-500/10 border-sky-500/30' },
  IN_PROGRESS: { label: 'En Ruta',      textClass: 'text-indigo-400', bgClass: 'bg-indigo-500/10 border-indigo-500/30' },
  COMPLETED:   { label: 'Completado',   textClass: 'text-emerald-400', bgClass: 'bg-emerald-500/10 border-emerald-500/30' },
  CANCELLED:   { label: 'Cancelado',    textClass: 'text-red-400',   bgClass: 'bg-red-500/10 border-red-500/30' },
};

function formatDate(dateStr: string) {
  try {
    return new Date(dateStr).toLocaleString('es-VE', {
      day: '2-digit', month: 'short',
      hour: '2-digit', minute: '2-digit', hour12: false,
    });
  } catch {
    return dateStr;
  }
}

export function Trips() {
  const [trips, setTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<StatusFilter>('ALL');
  const [dateFrom, setDateFrom] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  const load = useCallback(() => {
    setLoading(true);
    setError(null);
    tripsApi.getAll()
      .then(setTrips)
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  const filteredTrips = useMemo(() => {
    return trips.filter(trip => {
      if (status !== 'ALL' && trip.status !== status) return false;

      if (dateFrom) {
        const tripDate = new Date(trip.createdAt).toISOString().split('T')[0];
        if (tripDate !== dateFrom) return false;
      }

      if (searchTerm.trim()) {
        const term = searchTerm.toLowerCase();
        const clientMatch = trip.client?.name?.toLowerCase().includes(term);
        const driverMatch = trip.driver?.name?.toLowerCase().includes(term);
        const originMatch = trip.originAddress?.toLowerCase().includes(term);
        const destAddress = trip.destinationAddress || (trip as any).destAddress;
        const destMatch = destAddress?.toLowerCase().includes(term);
        return clientMatch || driverMatch || originMatch || destMatch;
      }

      return true;
    });
  }, [trips, status, dateFrom, searchTerm]);

  const exportCSV = () => {
    if (!filteredTrips.length) return;
    const headers = ['ID', 'Cliente', 'Conductor', 'Origen', 'Destino', 'Tarifa (USD)', 'Estado', 'Fecha'];
    const rows = filteredTrips.map(t => [
      t.id,
      t.client?.name ?? '',
      t.driver?.name ?? 'Sin asignar',
      `"${t.originAddress}"`,
      `"${t.destinationAddress || (t as any).destAddress || ''}"`,
      t.fare ?? 0,
      t.status,
      new Date(t.createdAt).toISOString(),
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `mara-rides-viajes-${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const counts = useMemo(() => {
    return STATUS_OPTIONS.reduce((acc, s) => {
      acc[s] = s === 'ALL' ? trips.length : trips.filter(t => t.status === s).length;
      return acc;
    }, {} as Record<string, number>);
  }, [trips]);

  return (
    <div className="flex flex-col min-h-screen">
      {/* ── HEADER ── */}
      <header
        className="flex items-center justify-between px-8 py-5 border-b"
        style={{ borderColor: 'var(--clr-border)', background: 'var(--clr-surface)' }}
      >
        <div>
          <div className="flex items-center gap-2">
            <Compass size={20} className="text-amber-500" />
            <h1 className="text-xl font-bold text-white tracking-tight">Historial y Auditoría de Viajes</h1>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Registro de carreras de mototaxis para fiscalización y control ciudadano
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={exportCSV}
            disabled={filteredTrips.length === 0}
            className="btn-ghost"
            title="Exportar a CSV"
          >
            <Download size={13} />
            <span>Exportar CSV</span>
          </button>
          <button
            onClick={load}
            disabled={loading}
            className="btn-ghost"
          >
            <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
            <span>Actualizar</span>
          </button>
        </div>
      </header>

      {/* ── BODY ── */}
      <div className="p-8 space-y-6">
        {error && (
          <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
            ⚠ {error}
          </div>
        )}

        {/* ── CONTROLS: TABS & FILTERS ── */}
        <div className="flex flex-col gap-4">
          {/* Status Tabs */}
          <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-900/80 border border-slate-800 overflow-x-auto">
            {STATUS_OPTIONS.map(s => {
              const active = status === s;
              const config = STATUS_CONFIG[s];
              return (
                <button
                  key={s}
                  onClick={() => setStatus(s)}
                  className={`text-xs font-semibold px-4 py-2 rounded-lg whitespace-nowrap transition-all ${
                    active
                      ? 'bg-amber-500 text-slate-950 shadow-sm'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                  }`}
                >
                  {config?.label ?? s} ({counts[s] ?? 0})
                </button>
              );
            })}
          </div>

          {/* Search + Date filter row */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="relative w-full sm:w-96">
              <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                type="text"
                placeholder="Buscar por cliente, conductor o dirección..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 rounded-xl text-xs bg-slate-900/80 border border-slate-800 text-white placeholder:text-slate-500 focus:outline-none focus:border-amber-500"
              />
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <Calendar size={14} className="text-slate-500" />
              <input
                type="date"
                value={dateFrom}
                onChange={e => setDateFrom(e.target.value)}
                className="px-3 py-1.5 rounded-lg text-xs bg-slate-900/80 border border-slate-800 text-white focus:outline-none focus:border-amber-500"
              />
              {dateFrom && (
                <button onClick={() => setDateFrom('')} className="text-xs text-amber-500 hover:underline">
                  Limpiar
                </button>
              )}
            </div>
          </div>
        </div>

        {/* ── TABLE ── */}
        <div className="panel overflow-hidden">
          {loading ? (
            <div className="p-12 text-center text-slate-500 text-sm">Cargando viajes...</div>
          ) : filteredTrips.length === 0 ? (
            <div className="p-12 text-center text-slate-500 text-sm">
              No se encontraron viajes con los filtros seleccionados.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Código</th>
                    <th>Pasajero</th>
                    <th>Mototaxista</th>
                    <th>Ruta (Origen → Destino)</th>
                    <th>Tarifa</th>
                    <th>Estado</th>
                    <th>Fecha / Hora</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTrips.map(trip => {
                    const dest = trip.destinationAddress || (trip as any).destAddress;
                    const config = STATUS_CONFIG[trip.status] || STATUS_CONFIG.ALL;
                    return (
                      <tr key={trip.id}>
                        {/* ID */}
                        <td>
                          <span className="font-mono text-xs text-slate-400 font-medium">
                            #{trip.id.slice(0, 8)}
                          </span>
                        </td>

                        {/* Pasajero */}
                        <td>
                          <p className="font-semibold text-slate-200 text-xs">{trip.client?.name}</p>
                          <p className="text-[11px] text-slate-500">{trip.client?.phone}</p>
                        </td>

                        {/* Conductor */}
                        <td>
                          {trip.driver ? (
                            <div>
                              <p className="font-semibold text-slate-200 text-xs">{trip.driver.name}</p>
                              <p className="text-[11px] text-slate-500">{trip.driver.phone}</p>
                            </div>
                          ) : (
                            <span className="text-xs text-slate-500 italic">Sin asignar</span>
                          )}
                        </td>

                        {/* Ruta */}
                        <td>
                          <div className="max-w-xs text-xs space-y-0.5">
                            <p className="text-slate-300 truncate">🟢 {trip.originAddress}</p>
                            <p className="text-slate-400 truncate">🏁 {dest}</p>
                          </div>
                        </td>

                        {/* Tarifa */}
                        <td>
                          <span className="font-mono text-xs font-bold text-amber-400">
                            ${trip.fare != null ? trip.fare.toFixed(2) : '0.00'}
                          </span>
                        </td>

                        {/* Estado */}
                        <td>
                          <span className={`badge ${config.textClass} ${config.bgClass}`}>
                            {config.label}
                          </span>
                        </td>

                        {/* Fecha */}
                        <td>
                          <span className="text-xs text-slate-400">
                            {formatDate(trip.createdAt)}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
