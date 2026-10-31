// ============================================================
// AdminLayout — packages/dashboard
// Shell: Modern Municipal Operations Center
// Redesigned with Refactoring UI & UI-UX Pro Max
// ============================================================

import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  MapPin,
  Users,
  Compass,
  LogOut,
  Navigation,
  Wifi,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useEffect, useState } from 'react';
import { getSocket } from '../../services/socket';

const NAV_ITEMS = [
  { to: '/',        icon: LayoutDashboard, label: 'Métricas & En Vivo', exact: true },
  { to: '/drivers', icon: Users,           label: 'Conductores',        exact: false },
  { to: '/trips',   icon: Compass,         label: 'Historial de Viajes', exact: false },
  { to: '/map',     icon: MapPin,          label: 'Mapa Completo',      exact: false },
];

export function AdminLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [socketConnected, setSocketConnected] = useState(false);

  useEffect(() => {
    const socket = getSocket();
    const onConnect    = () => setSocketConnected(true);
    const onDisconnect = () => setSocketConnected(false);
    setSocketConnected(socket.connected);
    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);
    return () => {
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
    };
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  const now = new Date();
  const dateStr = now.toLocaleDateString('es-VE', { weekday: 'short', day: '2-digit', month: 'short' });
  const timeStr = now.toLocaleTimeString('es-VE', { hour: '2-digit', minute: '2-digit', hour12: false });

  return (
    <div className="min-h-screen flex" style={{ background: 'var(--clr-bg)' }}>

      {/* ── SIDEBAR ── */}
      <aside
        className="w-[250px] flex-shrink-0 flex flex-col border-r shadow-lg"
        style={{ borderColor: 'var(--clr-border)', background: 'var(--clr-surface)' }}
      >
        {/* Brand Header */}
        <div className="px-6 py-6 border-b" style={{ borderColor: 'var(--clr-border)' }}>
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg bg-amber-500/10 flex items-center justify-center border border-amber-500/20">
              <Navigation size={20} className="text-amber-500" />
            </div>
            <div>
              <div className="text-lg font-bold tracking-tight text-white flex items-center gap-1">
                MARA<span className="text-amber-500">RIDES</span>
              </div>
              <p className="text-xs text-slate-400 font-medium">Control Municipal</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-5 px-2 space-y-1">
          {NAV_ITEMS.map(({ to, icon: Icon, label, exact }) => (
            <NavLink
              key={to}
              to={to}
              end={exact}
              className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
            >
              <Icon size={18} />
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>

        {/* Footer: Connection Status & Operator Info */}
        <div className="border-t p-4 space-y-4" style={{ borderColor: 'var(--clr-border)', background: 'rgba(11, 15, 23, 0.4)' }}>
          {/* Socket Indicator */}
          <div className="flex items-center justify-between px-2 py-1.5 rounded-lg bg-slate-900/60 border border-slate-800">
            <div className="flex items-center gap-2">
              <span className={`w-2 h-2 rounded-full ${socketConnected ? 'bg-emerald-400 animate-pulse' : 'bg-red-400'}`} />
              <span className="text-xs font-medium text-slate-300">
                {socketConnected ? 'GPS Satelital Activo' : 'Desconectado'}
              </span>
            </div>
            <Wifi size={13} className={socketConnected ? 'text-emerald-400' : 'text-slate-500'} />
          </div>

          {/* Time & Region */}
          <div className="px-2 text-xs text-slate-400 flex items-center justify-between">
            <span className="capitalize">{dateStr}</span>
            <span className="font-mono text-slate-300 font-semibold">{timeStr}</span>
          </div>

          {/* User profile */}
          <div className="border-t pt-3 px-2 flex items-center justify-between" style={{ borderColor: 'var(--clr-border)' }}>
            <div>
              <p className="text-xs font-semibold text-slate-200">
                {user?.name ?? 'Administrador'}
              </p>
              <p className="text-[11px] text-amber-500/90 font-medium">Oficina de Transporte</p>
            </div>
            <button
              onClick={handleLogout}
              title="Cerrar sesión"
              className="p-1.5 rounded-md text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-colors"
            >
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </aside>

      {/* ── MAIN CONTENT ── */}
      <main className="flex-1 overflow-auto flex flex-col">
        <Outlet />
      </main>
    </div>
  );
}
