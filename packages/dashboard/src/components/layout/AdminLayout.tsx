// ============================================================
// AdminLayout — packages/dashboard
// Shell: Sidebar + main content area
// Aesthetic: Graphic Realism / complement.md
// Desktop-First (admin dashboard, not mobile)
// ============================================================

import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import {
  Activity,
  Map,
  Users,
  FileText,
  LogOut,
  ShieldAlert,
  Wifi,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useEffect, useState } from 'react';
import { getSocket } from '../../services/socket';

const NAV_ITEMS = [
  { to: '/',        icon: Activity,  label: 'Dashboard',   exact: true },
  { to: '/drivers', icon: Users,     label: 'Conductores', exact: false },
  { to: '/trips',   icon: FileText,  label: 'Viajes',      exact: false },
  { to: '/map',     icon: Map,       label: 'Mapa Vivo',   exact: false },
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
  const dateStr = now.toLocaleDateString('es-VE', { weekday: 'short', day: '2-digit', month: 'short' }).toUpperCase();
  const timeStr = now.toLocaleTimeString('es-VE', { hour: '2-digit', minute: '2-digit', hour12: false });

  return (
    <div className="min-h-screen flex" style={{ background: 'var(--clr-bg)' }}>

      {/* ── SIDEBAR ── */}
      <aside
        className="w-[220px] flex-shrink-0 flex flex-col border-r"
        style={{ borderColor: 'var(--clr-border)', background: 'var(--clr-surface)' }}
      >
        {/* Logo / Branding */}
        <div
          className="px-5 py-6 border-b"
          style={{ borderColor: 'var(--clr-border)' }}
        >
          <div className="flex items-center gap-2 mb-1">
            <ShieldAlert size={18} style={{ color: 'var(--clr-accent)' }} />
            <span
              className="font-display text-lg tracking-wide"
              style={{ fontFamily: 'Anton, sans-serif', color: 'var(--clr-text)', letterSpacing: '0.05em' }}
            >
              CITY<span style={{ color: 'var(--clr-accent)' }}>TRANSIT</span>
            </span>
          </div>
          <p className="sys-id mt-1">SYS-ID: MTC-4892-A</p>
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-4">
          {NAV_ITEMS.map(({ to, icon: Icon, label, exact }) => (
            <NavLink
              key={to}
              to={to}
              end={exact}
              className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
            >
              <Icon size={14} />
              {label}
            </NavLink>
          ))}
        </nav>

        {/* Footer: user + status */}
        <div className="border-t px-4 py-4 space-y-3" style={{ borderColor: 'var(--clr-border)' }}>
          {/* Socket status */}
          <div className="flex items-center gap-2">
            <Wifi
              size={12}
              style={{ color: socketConnected ? 'var(--clr-accent)' : 'var(--clr-muted)' }}
            />
            <span className="font-mono text-xs" style={{ color: socketConnected ? 'var(--clr-accent)' : 'var(--clr-muted)' }}>
              {socketConnected ? 'SOCKET OK' : 'OFFLINE'}
            </span>
            {socketConnected && (
              <span className="w-1.5 h-1.5 rounded-full animate-blink" style={{ background: 'var(--clr-accent)' }} />
            )}
          </div>

          {/* Date/Time */}
          <div className="font-mono text-xs" style={{ color: 'var(--clr-muted)' }}>
            <div>{dateStr}</div>
            <div style={{ color: 'var(--clr-text)' }}>{timeStr} VET</div>
          </div>

          {/* User */}
          <div
            className="border-t pt-3 flex items-center justify-between"
            style={{ borderColor: 'var(--clr-border)' }}
          >
            <div>
              <p className="font-mono text-xs font-bold" style={{ color: 'var(--clr-text)' }}>
                {user?.name ?? 'ADMIN'}
              </p>
              <p className="sys-id">ROLE: {user?.role ?? '—'}</p>
            </div>
            <button onClick={handleLogout} title="Cerrar sesión" className="p-1 transition-colors" style={{ color: 'var(--clr-muted)' }}
              onMouseEnter={e => (e.currentTarget.style.color = 'var(--clr-danger)')}
              onMouseLeave={e => (e.currentTarget.style.color = 'var(--clr-muted)')}>
              <LogOut size={14} />
            </button>
          </div>
        </div>
      </aside>

      {/* ── MAIN CONTENT ── */}
      <main className="flex-1 overflow-auto">
        <Outlet />
      </main>
    </div>
  );
}
