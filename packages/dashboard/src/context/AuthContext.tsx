// ============================================================
// AuthContext — packages/dashboard
// Manages admin session: JWT + user info persisted in localStorage
// ============================================================

import { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { authApi } from '../services/api';
import { connectSocket, disconnectSocket } from '../services/socket';

interface AuthUser {
  id: string;
  name: string;
  role: string;
}

interface AuthContextValue {
  user: AuthUser | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (phone: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

// ── Bootstrap from localStorage ──
function loadPersistedSession(): { user: AuthUser | null; token: string | null } {
  try {
    const token = localStorage.getItem('auth_token');
    const raw   = localStorage.getItem('auth_user');
    const user  = raw ? (JSON.parse(raw) as AuthUser) : null;
    return { token, user };
  } catch {
    return { token: null, user: null };
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const persisted = loadPersistedSession();
  const [token, setToken] = useState<string | null>(persisted.token);
  const [user,  setUser]  = useState<AuthUser | null>(persisted.user);
  const [isLoading, setIsLoading] = useState(false);

  // If we loaded a persisted session, connect socket immediately
  // (done once on mount via the persisted token in localStorage)

  const login = useCallback(async (phone: string, password: string) => {
    setIsLoading(true);
    try {
      const data = await authApi.login(phone, password);
      if (data.user.role !== 'ADMIN') {
        throw new Error('Acceso denegado: se requiere rol ADMIN');
      }
      localStorage.setItem('auth_token', data.token);
      localStorage.setItem('auth_user', JSON.stringify(data.user));
      setToken(data.token);
      setUser(data.user);
      connectSocket();
    } finally {
      setIsLoading(false);
    }
  }, []);

  const logout = useCallback(() => {
    disconnectSocket();
    localStorage.removeItem('auth_token');
    localStorage.removeItem('auth_user');
    setToken(null);
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{
      user,
      token,
      isAuthenticated: !!token && !!user,
      isLoading,
      login,
      logout,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}
