// ============================================================
// Login Page — packages/dashboard
// Municipal Admin Login
// Redesigned with Refactoring UI & UI-UX Pro Max
// ============================================================

import { useState, FormEvent } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Navigation, Lock, Phone, AlertCircle, ArrowRight } from 'lucide-react';

export function Login() {
  const { login, isLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as { from?: { pathname: string } })?.from?.pathname ?? '/';

  const [phone,    setPhone]    = useState('');
  const [password, setPassword] = useState('');
  const [error,    setError]    = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      await login(phone, password);
      navigate(from, { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error de autenticación. Verifica tus credenciales.');
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center p-6"
      style={{ background: 'var(--clr-bg)' }}
    >
      <div className="w-full max-w-md">
        {/* Brand Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/20 mb-4 shadow-lg shadow-amber-500/5">
            <Navigation size={28} className="text-amber-500" />
          </div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight flex items-center justify-center gap-1.5">
            MARA<span className="text-amber-500">RIDES</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1 font-medium">
            Panel de Operaciones y Control Municipal de Mototaxis
          </p>
        </div>

        {/* Login Card */}
        <div className="panel p-8">
          <div className="border-b border-slate-800 pb-4 mb-6">
            <h2 className="text-base font-semibold text-slate-200">Ingreso Administrativo</h2>
            <p className="text-xs text-slate-400 mt-0.5">Introduce tus credenciales autorizadas</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Phone input */}
            <div>
              <label htmlFor="phone" className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                Teléfono
              </label>
              <div className="relative">
                <Phone size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  id="phone"
                  type="tel"
                  placeholder="Ej. 04141234567"
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  required
                  autoComplete="username"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl text-sm bg-slate-900/80 border border-slate-800 text-white placeholder:text-slate-500 focus:outline-none focus:border-amber-500 transition-colors"
                />
              </div>
            </div>

            {/* Password input */}
            <div>
              <label htmlFor="password" className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                Contraseña
              </label>
              <div className="relative">
                <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl text-sm bg-slate-900/80 border border-slate-800 text-white placeholder:text-slate-500 focus:outline-none focus:border-amber-500 transition-colors"
                />
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="p-3.5 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-xs flex items-center gap-2">
                <AlertCircle size={15} className="shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Submit Button */}
            <button
              id="btn-login"
              type="submit"
              disabled={isLoading}
              className="w-full btn-primary py-3 rounded-xl flex items-center justify-center gap-2 font-bold text-sm"
            >
              <span>{isLoading ? 'Autenticando...' : 'Acceder al Sistema'}</span>
              <ArrowRight size={16} />
            </button>
          </form>

          <p className="text-[11px] text-slate-500 text-center mt-6">
            Acceso auditado y restringido a personal de la Dirección de Transporte.
          </p>
        </div>
      </div>
    </div>
  );
}
