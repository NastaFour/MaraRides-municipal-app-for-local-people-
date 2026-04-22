// ============================================================
// Drivers Page — packages/dashboard
// Lista de conductores con aprobación/rechazo inline
// Fase 4 deliverable: "Admin puede aprobar un conductor"
// ============================================================

import { useEffect, useState, useCallback } from 'react';
import { CheckCircle, XCircle, RefreshCw, User } from 'lucide-react';
import { driversApi } from '../services/api';
import type { Driver } from '../services/api';

type FilterType = 'ALL' | 'PENDING' | 'APPROVED';

export function Drivers() {
  const [drivers,  setDrivers]  = useState<Driver[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [filter,   setFilter]   = useState<FilterType>('ALL');
  const [error,    setError]    = useState<string | null>(null);
  const [actionId, setActionId] = useState<string | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    setError(null);
    driversApi.getAll()
      .then(setDrivers)
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleApprove = async (id: string) => {
    setActionId(id);
    try {
      const updated = await driversApi.approve(id);
      setDrivers(prev => prev.map(d => d.id === id ? updated : d));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al aprobar');
    } finally {
      setActionId(null);
    }
  };

  const handleReject = async (id: string) => {
    setActionId(id);
    try {
      const updated = await driversApi.reject(id);
      setDrivers(prev => prev.map(d => d.id === id ? updated : d));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al rechazar');
    } finally {
      setActionId(null);
    }
  };

  const filtered = drivers.filter(d => {
    if (filter === 'PENDING')  return !d.isApproved;
    if (filter === 'APPROVED') return d.isApproved;
    return true;
  });

  const counts = {
    ALL:      drivers.length,
    PENDING:  drivers.filter(d => !d.isApproved).length,
    APPROVED: drivers.filter(d => d.isApproved).length,
  };

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
            GESTIÓN DE <span style={{ color: 'var(--clr-accent)' }}>CONDUCTORES</span>
          </h1>
          <p className="sys-id mt-1">// {counts.ALL} registrados — {counts.PENDING} pendientes de aprobación</p>
        </div>
        <button id="btn-refresh-drivers" onClick={load} className="btn-ghost flex items-center gap-2" disabled={loading}>
          <RefreshCw size={12} className={loading ? 'animate-spin' : ''} />
          ACTUALIZAR
        </button>
      </header>

      <div className="p-8 flex flex-col gap-6">
        {/* ── ERROR ── */}
        {error && (
          <div className="font-mono text-xs p-4" style={{ border: 'var(--border-danger)', color: 'var(--clr-danger)', background: 'rgba(255,51,0,0.06)' }}>
            ⚠ {error}
          </div>
        )}

        {/* ── FILTER TABS ── */}
        <div className="flex gap-0 border-b" style={{ borderColor: 'var(--clr-border)' }}>
          {(['ALL', 'PENDING', 'APPROVED'] as FilterType[]).map(f => (
            <button
              key={f}
              id={`filter-${f.toLowerCase()}`}
              onClick={() => setFilter(f)}
              className="font-mono text-xs uppercase tracking-widest px-5 py-3 transition-colors"
              style={{
                borderBottom: filter === f ? '2px solid var(--clr-accent)' : '2px solid transparent',
                color: filter === f ? 'var(--clr-accent)' : 'var(--clr-muted)',
                background: 'transparent',
                cursor: 'pointer',
                marginBottom: -1,
              }}
            >
              {f} ({counts[f]})
            </button>
          ))}
        </div>

        {/* ── DRIVER TABLE ── */}
        <div className="panel-accent overflow-hidden">
          {loading ? (
            <p className="font-mono text-xs p-6" style={{ color: 'var(--clr-muted)' }}>Cargando conductores...</p>
          ) : filtered.length === 0 ? (
            <p className="font-mono text-xs p-6" style={{ color: 'var(--clr-muted)' }}>Sin conductores en esta categoría.</p>
          ) : (
            <table className="data-table">
              <thead>
                <tr>
                  <th>Conductor</th>
                  <th>Teléfono</th>
                  <th>Vehículo</th>
                  <th>Estado operativo</th>
                  <th>Aprobación</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(driver => (
                  <tr key={driver.id}>
                    {/* Name */}
                    <td>
                      <div className="flex items-center gap-2">
                        <div
                          style={{
                            width: 28, height: 28, background: 'var(--clr-elevated)',
                            border: '1px solid var(--clr-border)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                          }}
                        >
                          <User size={12} style={{ color: 'var(--clr-muted)' }} />
                        </div>
                        <div>
                          <p className="font-mono text-xs font-bold" style={{ color: 'var(--clr-text)' }}>
                            {driver.name}
                          </p>
                          <p className="sys-id">{driver.id.slice(0, 8)}</p>
                        </div>
                      </div>
                    </td>

                    {/* Phone */}
                    <td>
                      <span className="font-mono text-xs" style={{ color: 'var(--clr-muted)' }}>
                        {driver.phone}
                      </span>
                    </td>

                    {/* Vehicle */}
                    <td>
                      {driver.vehicle ? (
                        <div>
                          <p className="font-mono text-xs" style={{ color: 'var(--clr-text)' }}>{driver.vehicle.plate}</p>
                          <p className="sys-id">{driver.vehicle.model} · {driver.vehicle.color}</p>
                        </div>
                      ) : (
                        <span className="sys-id">Sin vehículo</span>
                      )}
                    </td>

                    {/* Online status */}
                    <td>
                      <DriverStatusBadge status={driver.status} />
                    </td>

                    {/* Approval */}
                    <td>
                      <span
                        className="badge"
                        style={{
                          color: driver.isApproved ? 'var(--clr-accent)' : 'var(--clr-warn)',
                          borderColor: driver.isApproved ? 'var(--clr-accent)' : 'var(--clr-warn)',
                        }}
                      >
                        {driver.isApproved ? 'APROBADO' : 'PENDIENTE'}
                      </span>
                    </td>

                    {/* Actions */}
                    <td>
                      <div className="flex items-center gap-2">
                        {!driver.isApproved && (
                          <button
                            id={`btn-approve-${driver.id}`}
                            onClick={() => handleApprove(driver.id)}
                            disabled={actionId === driver.id}
                            className="flex items-center gap-1 font-mono text-xs px-3 py-1 transition-colors"
                            style={{
                              border: '1px solid var(--clr-accent)',
                              color: 'var(--clr-accent)',
                              background: 'transparent',
                              cursor: 'pointer',
                              opacity: actionId === driver.id ? 0.5 : 1,
                            }}
                            onMouseEnter={e => {
                              (e.currentTarget as HTMLButtonElement).style.background = 'var(--clr-accent)';
                              (e.currentTarget as HTMLButtonElement).style.color = '#000';
                            }}
                            onMouseLeave={e => {
                              (e.currentTarget as HTMLButtonElement).style.background = 'transparent';
                              (e.currentTarget as HTMLButtonElement).style.color = 'var(--clr-accent)';
                            }}
                          >
                            <CheckCircle size={10} />
                            APROBAR
                          </button>
                        )}
                        {driver.isApproved && (
                          <button
                            id={`btn-reject-${driver.id}`}
                            onClick={() => handleReject(driver.id)}
                            disabled={actionId === driver.id}
                            className="flex items-center gap-1 font-mono text-xs px-3 py-1 transition-colors"
                            style={{
                              border: '1px solid var(--clr-border)',
                              color: 'var(--clr-muted)',
                              background: 'transparent',
                              cursor: 'pointer',
                              opacity: actionId === driver.id ? 0.5 : 1,
                            }}
                            onMouseEnter={e => {
                              (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--clr-danger)';
                              (e.currentTarget as HTMLButtonElement).style.color = 'var(--clr-danger)';
                            }}
                            onMouseLeave={e => {
                              (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--clr-border)';
                              (e.currentTarget as HTMLButtonElement).style.color = 'var(--clr-muted)';
                            }}
                          >
                            <XCircle size={10} />
                            REVOCAR
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}

function DriverStatusBadge({ status }: { status: Driver['status'] }) {
  const map: Record<Driver['status'], { label: string; color: string }> = {
    ONLINE:  { label: 'DISPONIBLE', color: 'var(--clr-accent)' },
    IN_TRIP: { label: 'EN VIAJE',   color: 'var(--clr-cyan)' },
    OFFLINE: { label: 'OFFLINE',    color: 'var(--clr-muted)' },
  };
  const { label, color } = map[status as string] || { label: status || 'UNKNOWN', color: 'var(--clr-muted)' };
  return <span className="badge" style={{ color, borderColor: color }}>{label}</span>;
}
