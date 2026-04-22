import React, { createContext, useState, useEffect, ReactNode } from 'react';
import { useRouter, useSegments } from 'expo-router';
import { User, getToken, removeToken } from '../services/api';
import { getUser, removeUser } from '../utils/storage';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  loginSession: (user: User) => void;
  logout: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  loginSession: () => {},
  logout: async () => {},
});

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    // Check initial auth state
    const initAuth = async () => {
      try {
        const token = await getToken();
        if (!token) throw new Error('No token');
        
        const storedUser = await getUser();
        if (storedUser) setUser(storedUser);
      } catch {
        // Not logged in
        setUser(null);
      } finally {
        setLoading(false);
      }
    };
    initAuth();
  }, []);

  // Protected route logic handler triggered whenever user/segment changes
  useEffect(() => {
    if (loading) return;

    const inAuthGroup = segments[0] === 'auth';
    const isRoot = segments.length === 0;

    if (!user && !inAuthGroup && !isRoot) {
      // Trying to access protected route without auth:
      router.replace('/auth/login');
    } else if (user) {
      // Logged in user redirection based on roles:
      if (inAuthGroup || isRoot) {
        if (user.role === 'CLIENT') {
          router.replace('/(client)'); // client dashboard
        } else if (user.role === 'DRIVER') {
          router.replace('/(driver)'); // driver dashboard
        } else {
          // Admin uses web dashboard, shouldn't be here ideally, but fallback:
          router.replace('/auth/login');
        }
      }
    }
  }, [user, segments, loading]);

  const loginSession = (newUser: User) => {
    setUser(newUser);
  };

  const logout = async () => {
    await removeToken();
    await removeUser();
    setUser(null);
    router.replace('/');
  };

  return (
    <AuthContext.Provider value={{ user, loading, loginSession, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
