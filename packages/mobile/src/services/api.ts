import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

// Use host machine's IP for Android emulator or localhost for iOS simulator
// We default to 10.0.2.2 because Android Emulator bridges to local host using 10.0.2.2
const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 
  (Platform.OS === 'android' ? 'http://10.0.2.2:3001' : 'http://localhost:3001');

const TOKEN_KEY = '@mototaxi_jwt';

export const getToken = async () => await AsyncStorage.getItem(TOKEN_KEY);
export const setToken = async (token: string) => await AsyncStorage.setItem(TOKEN_KEY, token);
export const removeToken = async () => await AsyncStorage.removeItem(TOKEN_KEY);

interface RequestOptions extends RequestInit {
  skipAuth?: boolean;
}

export async function request<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
  const { skipAuth = false, ...fetchOptions } = options;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(fetchOptions.headers as Record<string, string>),
  };

  if (!skipAuth) {
    const token = await getToken();
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

  if (res.status === 204) return {} as T;

  const json = await res.json();
  if (json && typeof json === 'object' && 'success' in json && 'data' in json) {
    return json.data as T;
  }
  return json as T;
}

// ── Shared Types ──
export interface User {
  id: string;
  name: string;
  phone: string;
  role: 'CLIENT' | 'ADMIN' | 'DRIVER';
}

export interface Trip {
  id: string;
  clientId: string;
  driverId: string | null;
  status: 'REQUESTED' | 'ACCEPTED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
  originAddress: string;
  destAddress: string; // destAddress from prisma
  originLat: number;
  originLng: number;
  destLat: number;
  destLng: number;
  fare: number | null;
  createdAt: string;
  driver?: { id: string; name: string; phone: string };
  client?: { name: string; phone: string };
}
