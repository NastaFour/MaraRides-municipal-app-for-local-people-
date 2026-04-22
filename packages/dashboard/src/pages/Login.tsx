// ============================================================
// Login Page — packages/dashboard
// Admin-only login. Aesthetic: Graphic Realism / complement.md
// Desktop-First: centered panel, hard shadows, monospace form
// ============================================================

import { useState, FormEvent } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ShieldAlert, Terminal } from 'lucide-react';

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
      setError(err instanceof Error ? err.message : 'Error de autenticación');
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center p-8"
      style={{ background: 'var(--clr-bg)' }}
    >
      {/* ── LOGIN PANEL ── */}
      <div style={{ width: '100%', maxWidth: 420 }}>

        {/* Header decoration */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <ShieldAlert size={24} style={{ color: 'var(--clr-accent)' }} />
            <h1
              style={{
                fontFamily: 'Anton, sans-serif',
                fontSize: '2rem',
                letterSpacing: '0.08em',
                color: 'var(--clr-text)',
                lineHeight: 1,
              }}
            >
              CITY<span style={{ color: 'var(--clr-accent)' }}>TRANSIT</span>
            </h1>
          </div>
          <p className="sys-id">// MUNICIPAL CONTROL CENTER — AUTH REQUIRED</p>
        </div>

        {/* Panel */}
        <div
          className="panel-accent corner-bracket"
          style={{ padding: '2rem' }}
        >
          {/* Terminal heading */}
          <div className="flex items-center gap-2 mb-6" style={{ borderBottom: '1px solid var(--clr-border)', paddingBottom: '1rem' }}>
            <Terminal size={14} style={{ color: 'var(--clr-accent)' }} />
            <span className="font-mono text-xs uppercase tracking-widest" style={{ color: 'var(--clr-muted)' }}>
              admin.login v1.0
            </span>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            {/* Phone */}
            <div>
              <label
                htmlFor="phone"
                className="font-mono text-xs uppercase tracking-widest mb-1 block"
                style={{ color: 'var(--clr-muted)' }}
              >
                &gt; Teléfono
              </label>
              <input
                id="phone"
                type="tel"
                className="input-field"
                placeholder="0000000000"
                value={phone}
                onChange={e => setPhone(e.target.value)}
                required
                autoComplete="username"
              />
            </div>

            {/* Password */}
            <div>
              <label
                htmlFor="password"
                className="font-mono text-xs uppercase tracking-widest mb-1 block"
                style={{ color: 'var(--clr-muted)' }}
              >
                &gt; Contraseña
              </label>
              <input
                id="password"
                type="password"
                className="input-field"
                placeholder="••••••••"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                autoComplete="current-password"
              />
            </div>

            {/* Error */}
            {error && (
              <div
                className="font-mono text-xs p-3"
                style={{
                  border: 'var(--border-danger)',
                  color: 'var(--clr-danger)',
                  background: 'rgba(255,51,0,0.08)',
                }}
              >
                ⚠ {error}
              </div>
            )}

            {/* Submit */}
            <button
              id="btn-login"
              type="submit"
              disabled={isLoading}
              className="btn-accent mt-2"
              style={{
                opacity: isLoading ? 0.6 : 1,
                cursor: isLoading ? 'not-allowed' : 'pointer',
                minHeight: 48,
              }}
            >
              {isLoading ? '[ AUTENTICANDO... ]' : '[ ACCEDER AL SISTEMA ]'}
            </button>
          </form>

          {/* Hint */}
          <p className="sys-id mt-4 text-center">
            Acceso restringido — Solo administradores municipales
          </p>
        </div>

        {/* Bottom decoration */}
        <div className="flex justify-between mt-4">
          <span className="sys-id">REV: 2026.04.20</span>
          <span className="sys-id">MTC-SYS // [SECURE]</span>
        </div>
      </div>
    </div>
  );
}
