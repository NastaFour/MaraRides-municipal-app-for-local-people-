// ============================================================
// Drivers Page — packages/dashboard
// Municipal Driver Registry & Licensure Verification
// Redesigned with Refactoring UI & UI-UX Pro Max
// ============================================================

import { useEffect, useState, useCallback, useMemo } from 'react';
import {
  CheckCircle2,
  XCircle,
  RefreshCw,
  Search,
  Bike,
  Star,
  ShieldCheck,
  AlertCircle,
  Phone,
} from 'lucide-react';
import { driversApi } from '../services/api';
import type { Driver } from '../services/api';

type FilterType = 'ALL' | 'PENDING' | 'APPROVED';

export function Drivers() {
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<FilterType>('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [error, setError] = useState<string | null>(null);
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
      setError(err instanceof Error ? err.message : 'Error al aprobar conductor');
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
      setError(err instanceof Error ? err.message : 'Error al revocar aprobación');
    } finally {
      setActionId(null);
    }
  };

  const filtered = useMemo(() => {
    return drivers.filter(d => {
      if (filter === 'PENDING' && d.isApproved) return false;
      if (filter === 'APPROVED' && !d.isApproved) return false;

      if (searchTerm.trim()) {
        const term = searchTerm.toLowerCase();
        const matchesName = d.name?.toLowerCase().includes(term);
        const matchesPhone = d.phone?.includes(term);
        const matchesPlate = d.vehicle?.plate?.toLowerCase().includes(term);
        const matchesLicense = d.licenseNum?.toLowerCase().includes(term);
        return matchesName || matchesPhone || matchesPlate || matchesLicense;
      }
      return true;
    });
  }, [drivers, filter, searchTerm]);

  const counts = {
    ALL: drivers.length,
    PENDING: drivers.filter(d => !d.isApproved).length,
    APPROVED: drivers.filter(d => d.isApproved).length,
  };

  return (
    <div className="flex flex-col min-h-screen">
      {/* ── HEADER ── */}
      <header
        className="flex items-center justify-between px-8 py-5 border-b"
        style={{ borderColor: 'var(--clr-border)', background: 'var(--clr-surface)' }}
      >
        <div>
          <div className="flex items-center gap-2">
            <Bike size={20} className="text-amber-500" />
            <h1 className="text-xl font-bold text-white tracking-tight">Padrón de Conductores de Mototaxis</h1>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            {counts.ALL} mototaxistas inscritos · {counts.PENDING} pendientes de revisión y aval municipal
          </p>
        </div>

        <button
          onClick={load}
          className="btn-ghost"
          disabled={loading}
        >
          <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
          <span>Actualizar</span>
        </button>
      </header>

      {/* ── BODY ── */}
      <div className="p-8 space-y-6">
        {error && (
          <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm flex items-center justify-between">
            <span>⚠ {error}</span>
            <button onClick={() => setError(null)} className="underline text-xs">Cerrar</button>
          </div>
        )}

        {/* ── CONTROLS BAR: FILTERS + SEARCH ── */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          {/* Filter Pills */}
          <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-900/80 border border-slate-800">
            {(['ALL', 'PENDING', 'APPROVED'] as FilterType[]).map(f => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`text-xs font-semibold px-4 py-2 rounded-lg transition-all ${
                  filter === f
                    ? 'bg-amber-500 text-slate-950 shadow-sm'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                }`}
              >
                {f === 'ALL' ? 'Todos' : f === 'PENDING' ? 'Pendientes' : 'Aprobados'} ({counts[f]})
              </button>
            ))}
          </div>

          {/* Search Box */}
          <div className="relative w-full sm:w-80">
            <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              placeholder="Buscar por nombre, placa o teléfono..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-xl text-xs bg-slate-900/80 border border-slate-800 text-white placeholder:text-slate-500 focus:outline-none focus:border-amber-500"
            />
          </div>
        </div>

        {/* ── DRIVER TABLE ── */}
        <div className="panel overflow-hidden">
          {loading ? (
            <div className="p-12 text-center text-slate-500 text-sm">Cargando conductores...</div>
          ) : filtered.length === 0 ? (
            <div className="p-12 text-center text-slate-500 text-sm">
              No se encontraron conductores con los criterios actuales.
            </div>
          ) : (
            <table className="data-table">
              <thead>
                <tr>
                  <th>Conductor</th>
                  <th>Contacto</th>
                  <th>Mototaxi / Placa</th>
                  <th>Licencia</th>
                  <th>Reputación</th>
                  <th>Estado</th>
                  <th>Acción Municipal</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(driver => (
                  <tr key={driver.id}>
                    {/* Conductor */}
                    <td>
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-slate-800 flex items-center justify-center font-bold text-amber-500 border border-slate-700">
                          {driver.name ? driver.name.charAt(0).toUpperCase() : 'M'}
                        </div>
                        <div>
                          <p className="font-semibold text-slate-100 text-sm">{driver.name}</p>
                          <p className="text-[11px] text-slate-500 font-mono">ID: {driver.id.slice(0, 8)}</p>
                        </div>
                      </div>
                    </td>

                    {/* Contacto */}
                    <td>
                      <div className="flex items-center gap-1.5 text-slate-300 text-xs">
                        <Phone size={12} className="text-slate-500" />
                        <span>{driver.phone}</span>
                      </div>
                    </td>

                    {/* Vehículo */}
                    <td>
                      {driver.vehicle ? (
                        <div>
                          <span className="font-mono text-xs font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                            {driver.vehicle.plate}
                          </span>
                          <p className="text-xs text-slate-400 mt-1">
                            {driver.vehicle.model}
                          </p>
                        </div>
                      ) : (
                        <span className="text-xs text-slate-500 italic">Sin mototaxi asignada</span>
                      )}
                    </td>

                    {/* Licencia */}
                    <td>
                      <span className="font-mono text-xs text-slate-300">
                        {driver.licenseNum}
                      </span>
                    </td>

                    {/* Reputación */}
                    <td>
                      <div className="flex items-center gap-1 text-xs">
                        <Star size={13} className="text-amber-400 fill-amber-400" />
                        <span className="font-bold text-slate-200">
                          {((driver as any).ratingAvg ?? 5.0).toFixed(1)}
                        </span>
                        <span className="text-[11px] text-slate-500">
                          ({(driver as any).totalTrips ?? 0} viajes)
                        </span>
                      </div>
                    </td>

                    {/* Estado Operativo */}
                    <td>
                      <DriverStatusBadge status={driver.status} />
                    </td>

                    {/* Acciones */}
                    <td>
                      <div className="flex items-center gap-2">
                        {!driver.isApproved ? (
                          <button
                            onClick={() => handleApprove(driver.id)}
                            disabled={actionId === driver.id}
                            className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg bg-emerald-500 text-slate-950 hover:bg-emerald-400 transition-colors disabled:opacity-50"
                          >
                            <ShieldCheck size={14} />
                            Aprobar
                          </button>
                        ) : (
                          <button
                            onClick={() => handleReject(driver.id)}
                            disabled={actionId === driver.id}
                            className="inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg border border-red-500/30 text-red-400 hover:bg-red-500/10 transition-colors disabled:opacity-50"
                          >
                            <XCircle size={14} />
                            Revocar
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
  if (status === 'ONLINE') {
    return (
      <span className="badge text-emerald-400 border-emerald-500/30 bg-emerald-500/10">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
        Disponible
      </span>
    );
  }
  if (status === 'IN_TRIP') {
    return (
      <span className="badge text-sky-400 border-sky-500/30 bg-sky-500/10">
        <span className="w-1.5 h-1.5 rounded-full bg-sky-400" />
        En Viaje
      </span>
    );
  }
  return (
    <span className="badge text-slate-500 border-slate-700 bg-slate-800/40">
      Desconectado
    </span>
  );
}
