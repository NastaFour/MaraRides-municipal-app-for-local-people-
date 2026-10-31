// ============================================================
// MapPage — packages/dashboard
// Fullscreen Municipal Real-time GPS Tracking
// Redesigned with Refactoring UI & UI-UX Pro Max
// ============================================================

import { useEffect, useState } from 'react';
import { RefreshCw, MapPin, Navigation } from 'lucide-react';
import { driversApi } from '../services/api';
import type { Driver } from '../services/api';
import { LiveMap } from '../components/maps/LiveMap';

export function MapPage() {
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = () => {
    setLoading(true);
    driversApi.getAll()
      .then(setDrivers)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadData();
  }, []);

  const initialLocations = drivers
    .filter(d => d.latitude != null && d.longitude != null)
    .map(d => ({
      driverId: d.id,
      lat: d.latitude!,
      lng: d.longitude!,
      status: d.status,
      driverName: d.name,
    }));

  const onlineDrivers = drivers.filter(d => d.status === 'ONLINE').length;
  const onTripDrivers = drivers.filter(d => d.status === 'IN_TRIP').length;
  const totalOperating = onlineDrivers + onTripDrivers;

  return (
    <div className="flex flex-col h-screen overflow-hidden">
      {/* ── TOP BAR ── */}
      <header
        className="flex items-center justify-between px-8 py-4 border-b flex-shrink-0 z-10"
        style={{ borderColor: 'var(--clr-border)', background: 'var(--clr-surface)' }}
      >
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center text-amber-500">
            <MapPin size={18} />
          </div>
          <div>
            <h1 className="text-base font-bold text-white tracking-tight">Mapa Táctico de Unidades</h1>
            <p className="text-xs text-slate-400">Municipio Mara · Cobertura y Despliegue Satelital</p>
          </div>
        </div>

        {/* Status Indicators */}
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-base font-extrabold text-white leading-none">
                {loading ? '—' : totalOperating}
              </p>
              <p className="text-[10px] text-slate-400 uppercase tracking-wider mt-0.5">En Operación</p>
            </div>
            <div className="text-right">
              <p className="text-base font-extrabold text-emerald-400 leading-none">
                {loading ? '—' : onlineDrivers}
              </p>
              <p className="text-[10px] text-slate-400 uppercase tracking-wider mt-0.5">Disponibles</p>
            </div>
            <div className="text-right">
              <p className="text-base font-extrabold text-sky-400 leading-none">
                {loading ? '—' : onTripDrivers}
              </p>
              <p className="text-[10px] text-slate-400 uppercase tracking-wider mt-0.5">En Carrera</p>
            </div>
          </div>

          <div className="h-6 w-px bg-slate-800" />

          <button
            onClick={loadData}
            disabled={loading}
            className="btn-ghost"
            title="Recargar posiciones"
          >
            <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
            <span>Refrescar</span>
          </button>
        </div>
      </header>

      {/* ── FULLSCREEN MAP ── */}
      <div className="flex-1 w-full relative" style={{ minHeight: 0 }}>
        <LiveMap initialDrivers={initialLocations} height="100%" />
      </div>

      {/* ── FOOTER LEGEND ── */}
      <footer
        className="flex items-center justify-between px-8 py-2.5 border-t flex-shrink-0 text-xs"
        style={{ borderColor: 'var(--clr-border)', background: 'var(--clr-surface)' }}
      >
        <div className="flex items-center gap-6">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Leyenda:</span>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
            <span className="text-slate-300">Disponible</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-sky-400" />
            <span className="text-slate-300">En Viaje</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-slate-600" />
            <span className="text-slate-400">Fuera de Línea</span>
          </div>
        </div>

        <div className="text-[11px] text-slate-500 font-mono">
          Sistema Mara Rides · Coordenadas WGS84
        </div>
      </footer>
    </div>
  );
}
