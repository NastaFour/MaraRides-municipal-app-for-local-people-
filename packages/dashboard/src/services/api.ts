// ============================================================
// API Service — packages/dashboard
// Wraps fetch with base URL + JWT Authorization header injection
// Stack: Vanilla fetch — no axios (not in approved stack)
// ============================================================

const API_BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3001';

function getToken(): string | null {
  return localStorage.getItem('auth_token');
}

interface RequestOptions extends RequestInit {
  skipAuth?: boolean;
}

async function request<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
  const { skipAuth = false, ...fetchOptions } = options;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(fetchOptions.headers as Record<string, string>),
  };

  if (!skipAuth) {
    const token = getToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
  }

  const res = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...fetchOptions,
    headers,
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({ message: res.statusText }));
    throw new Error(errorData.message || errorData.data?.message || `Error ${res.status}`);
  }

  // Handle 204 No Content
  if (res.status === 204) return {} as T;

  const json = await res.json();
  // Unwrap API envelope: { success: true, data: T } → T
  if (json && typeof json === 'object' && 'success' in json && 'data' in json) {
    return json.data as T;
  }
  return json as T;
}

// ── Auth endpoints ──
export const authApi = {
  login: (phone: string, password: string) =>
    request<{ token: string; user: { id: string; name: string; role: string } }>(
      '/auth/client/login',
      { method: 'POST', body: JSON.stringify({ phone, password }), skipAuth: true }
    ),
};

// ── Driver endpoints ──
export const driversApi = {
  getAll: () =>
    request<Driver[]>('/drivers'),

  getById: (id: string) =>
    request<Driver>(`/drivers/${id}`),

  approve: (id: string) =>
    request<Driver>(`/drivers/${id}/approve`, {
      method: 'PATCH',
      body: JSON.stringify({ isApproved: true }),
    }),

  reject: (id: string) =>
    request<Driver>(`/drivers/${id}/approve`, {
      method: 'PATCH',
      body: JSON.stringify({ isApproved: false }),
    }),
};

// ── Trip endpoints ──
export const tripsApi = {
  getAll: (params?: { status?: string; date?: string }) => {
    const query = params
      ? '?' + new URLSearchParams(params as Record<string, string>).toString()
      : '';
    return request<Trip[]>(`/trips${query}`);
  },

  cancel: (id: string) =>
    request<Trip>(`/trips/${id}/cancel`, { method: 'PATCH' }),
};

// ── Shared Types (align with @mototaxi/shared) ──
export interface Driver {
  id: string;
  name: string;
  phone: string;
  licenseNum: string;
  isApproved: boolean;
  status: 'ONLINE' | 'OFFLINE' | 'IN_TRIP';
  latitude: number | null;   // API field name
  longitude: number | null;  // API field name
  createdAt: string;
  vehicle?: Vehicle;
}

export interface Vehicle {
  id: string;
  plate: string;
  model: string;
  color: string;
}

export interface Trip {
  id: string;
  status: 'REQUESTED' | 'ACCEPTED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
  originAddress: string;
  destinationAddress: string;
  fare: number | null;
  createdAt: string;
  completedAt: string | null;
  client: { name: string; phone: string };
  driver?: { name: string; phone: string };
}
