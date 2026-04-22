// ============================================================
// Trips Page — packages/dashboard
// Historial de viajes con filtros por estado y fecha
// ============================================================

import { useEffect, useState, useCallback } from 'react';
import { RefreshCw, Calendar } from 'lucide-react';
import { tripsApi } from '../services/api';
import type { Trip } from '../services/api';

type StatusFilter = 'ALL' | Trip['status'];

const STATUS_OPTIONS: StatusFilter[] = ['ALL', 'REQUESTED', 'ACCEPTED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'];

const STATUS_META: Record<string, { label: string; color: string }> = {
  ALL:         { label: 'TODOS',      color: 'var(--clr-muted)' },
  REQUESTED:   { label: 'SOLICITADO', color: 'var(--clr-warn)' },
  ACCEPTED:    { label: 'ACEPTADO',   color: 'var(--clr-cyan)' },
  IN_PROGRESS: { label: 'EN CURSO',   color: 'var(--clr-accent)' },
  COMPLETED:   { label: 'COMPLETADO', color: 'var(--clr-accent)' },
  CANCELLED:   { label: 'CANCELADO',  color: 'var(--clr-danger)' },
};

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleString('es-VE', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit', hour12: false,
  });
}

export function Trips() {
  const [trips,    setTrips]    = useState<Trip[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState<string | null>(null);
  const [status,   setStatus]   = useState<StatusFilter>('ALL');
  const [dateFrom, setDateFrom] = useState('');

  const load = useCallback(() => {
    setLoading(true);
    setError(null);
    // API returns all trips for ADMIN, we just load them once
    tripsApi.getAll()
      .then(setTrips)
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  // Frontend Filtering
  const filteredTrips = trips.filter(trip => {
    // 1. Status Match
    const matchStatus = status === 'ALL' || trip.status === status;
    // 2. Date Match
    let matchDate = true;
    if (dateFrom) {
      const tripDate = new Date(trip.createdAt).toISOString().split('T')[0];
      matchDate = tripDate === dateFrom;
    }
    return matchStatus && matchDate;
  });

  const counts = STATUS_OPTIONS.reduce((acc, s) => {
    acc[s] = s === 'ALL' ? trips.length : trips.filter(t => t.status === s).length;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className="flex flex-col min-h-screen">
      {/* ── HEADER ── */}
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
            HISTORIAL DE <span style={{ color: 'var(--clr-accent)' }}>VIAJES</span>
          </h1>
          <p className="sys-id mt-1">// {trips.length} registros totales</p>
        </div>
        <div className="flex items-center gap-3">
          {/* Date filter */}
          <div className="flex items-center gap-2">
            <Calendar size={12} style={{ color: 'var(--clr-muted)' }} />
            <input
              id="filter-date"
              type="date"
              className="input-field"
              style={{ width: 160, padding: '4px 8px', fontSize: 12 }}
              value={dateFrom}
              onChange={e => setDateFrom(e.target.value)}
            />
          </div>
          <button id="btn-refresh-trips" onClick={load} className="btn-ghost flex items-center gap-2" disabled={loading}>
            <RefreshCw size={12} className={loading ? 'animate-spin' : ''} />
            ACTUALIZAR
          </button>
        </div>
      </header>

      <div className="p-8 flex flex-col gap-6">
        {/* ── ERROR ── */}
        {error && (
          <div className="font-mono text-xs p-4" style={{ border: 'var(--border-danger)', color: 'var(--clr-danger)', background: 'rgba(255,51,0,0.06)' }}>
            ⚠ {error}
          </div>
        )}

        {/* ── STATUS FILTER TABS ── */}
        <div className="flex gap-0 border-b flex-wrap" style={{ borderColor: 'var(--clr-border)' }}>
          {STATUS_OPTIONS.map(s => (
            <button
              key={s}
              id={`tab-${s.toLowerCase()}`}
              onClick={() => setStatus(s)}
              className="font-mono text-xs uppercase tracking-widest px-4 py-3 transition-colors"
              style={{
                borderBottom: status === s
                  ? `2px solid ${STATUS_META[s].color}`
                  : '2px solid transparent',
                color: status === s ? STATUS_META[s].color : 'var(--clr-muted)',
                background: 'transparent',
                cursor: 'pointer',
                marginBottom: -1,
              }}
            >
              {STATUS_META[s].label}
              <span
                className="ml-1 font-mono text-xs"
                style={{ opacity: 0.6 }}
              >
                ({counts[s] ?? 0})
              </span>
            </button>
          ))}
        </div>

        {/* ── TRIPS TABLE ── */}
        <div className="panel-accent overflow-hidden">
          {loading ? (
            <p className="font-mono text-xs p-6" style={{ color: 'var(--clr-muted)' }}>Cargando viajes...</p>
          ) : filteredTrips.length === 0 ? (
            <p className="font-mono text-xs p-6" style={{ color: 'var(--clr-muted)' }}>Sin viajes en este filtro.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Cliente</th>
                    <th>Conductor</th>
                    <th>Origen</th>
                    <th>Destino</th>
                    <th>Estado</th>
                    <th>Tarifa</th>
                    <th>Fecha</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTrips.map(trip => (
                    <tr key={trip.id}>
                      {/* ID */}
                      <td>
                        <span className="sys-id">{trip.id.slice(0, 8)}</span>
                      </td>

                      {/* Client */}
                      <td>
                        <p className="font-mono text-xs" style={{ color: 'var(--clr-text)' }}>{trip.client.name}</p>
                        <p className="sys-id">{trip.client.phone}</p>
                      </td>

                      {/* Driver */}
                      <td>
                        {trip.driver ? (
                          <div>
                            <p className="font-mono text-xs" style={{ color: 'var(--clr-text)' }}>{trip.driver.name}</p>
                            <p className="sys-id">{trip.driver.phone}</p>
                          </div>
                        ) : (
                          <span className="sys-id">Sin asignar</span>
                        )}
                      </td>

                      {/* Origin */}
                      <td>
                        <span className="font-mono text-xs" style={{ color: 'var(--clr-muted)', maxWidth: 160, display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {trip.originAddress}
                        </span>
                      </td>

                      {/* Destination */}
                      <td>
                        <span className="font-mono text-xs" style={{ color: 'var(--clr-muted)', maxWidth: 160, display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {trip.destinationAddress}
                        </span>
                      </td>

                      {/* Status */}
                      <td>
                        <span
                          className="badge"
                          style={{
                            color: STATUS_META[trip.status as string]?.color || 'var(--clr-muted)',
                            borderColor: STATUS_META[trip.status as string]?.color || 'var(--clr-muted)',
                          }}
                        >
                          {STATUS_META[trip.status as string]?.label || trip.status}
                        </span>
                      </td>

                      {/* Fare */}
                      <td>
                        <span className="font-mono text-xs" style={{ color: trip.fare ? 'var(--clr-accent)' : 'var(--clr-muted)' }}>
                          {trip.fare != null ? `Bs. ${trip.fare.toFixed(2)}` : '—'}
                        </span>
                      </td>

                      {/* Date */}
                      <td>
                        <span className="font-mono" style={{ fontSize: 10, color: 'var(--clr-muted)' }}>
                          {formatDate(trip.createdAt)}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
