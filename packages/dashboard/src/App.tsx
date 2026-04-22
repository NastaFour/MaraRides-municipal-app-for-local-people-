// ============================================================
// App.tsx — packages/dashboard
// Root router — wires AuthProvider + all routes
// ============================================================

import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ProtectedRoute } from './components/layout/ProtectedRoute';
import { AdminLayout } from './components/layout/AdminLayout';
import { Login } from './pages/Login';
import { Dashboard } from './pages/Dashboard';
import { Drivers } from './pages/Drivers';
import { Trips } from './pages/Trips';
import { MapPage } from './pages/MapPage';

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* ── PUBLIC ── */}
          <Route path="/login" element={<Login />} />

          {/* ── PROTECTED (admin only) ── */}
          <Route element={<ProtectedRoute />}>
            <Route element={<AdminLayout />}>
              <Route index        element={<Dashboard />} />
              <Route path="drivers" element={<Drivers />} />
              <Route path="trips"   element={<Trips />} />
              <Route path="map"     element={<MapPage />} />
            </Route>
          </Route>

          {/* ── FALLBACK ── */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
