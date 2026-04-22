// ─── Enums ───────────────────────────────────────────────────────────────────

export enum Role {
  ADMIN = 'ADMIN',
  CLIENT = 'CLIENT',
}

export enum DriverStatus {
  ONLINE = 'ONLINE',
  OFFLINE = 'OFFLINE',
  IN_TRIP = 'IN_TRIP',
}

export enum TripStatus {
  REQUESTED = 'REQUESTED',
  ACCEPTED = 'ACCEPTED',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
}

// ─── User ────────────────────────────────────────────────────────────────────

export interface User {
  id: string;
  name: string;
  phone: string;
  email?: string | null;
  role: Role;
  createdAt: Date;
}

// ─── Driver ──────────────────────────────────────────────────────────────────

export interface Driver {
  id: string;
  name: string;
  phone: string;
  licenseNum: string;
  status: DriverStatus;
  isApproved: boolean;
  vehicle?: Vehicle | null;
  latitude?: number | null;
  longitude?: number | null;
  createdAt: Date;
}

// ─── Vehicle ─────────────────────────────────────────────────────────────────

export interface Vehicle {
  id: string;
  plate: string;
  model: string;
  year: number;
  driverId: string;
}

// ─── Trip ────────────────────────────────────────────────────────────────────

export interface Trip {
  id: string;
  clientId: string;
  client?: Pick<User, 'id' | 'name' | 'phone'>;
  driverId?: string | null;
  driver?: Pick<Driver, 'id' | 'name' | 'phone' | 'latitude' | 'longitude'> | null;
  originLat: number;
  originLng: number;
  destLat: number;
  destLng: number;
  originAddress: string;
  destAddress: string;
  status: TripStatus;
  fare?: number | null;
  createdAt: Date;
  completedAt?: Date | null;
}

// ─── Socket Event Payloads ────────────────────────────────────────────────────

export interface DriverLocationPayload {
  driverId: string;
  latitude: number;
  longitude: number;
}

export interface TripNewPayload {
  trip: Trip;
}

export interface TripUpdatePayload {
  tripId: string;
  status: TripStatus;
  driverId?: string;
}

// ─── API Response Wrappers ────────────────────────────────────────────────────

export interface ApiSuccess<T> {
  success: true;
  data: T;
}

export interface ApiError {
  success: false;
  message: string;
  errors?: Record<string, string[]>;
}

export type ApiResponse<T> = ApiSuccess<T> | ApiError;

// ─── Auth ─────────────────────────────────────────────────────────────────────

export interface AuthPayload {
  token: string;
  user?: Pick<User, 'id' | 'name' | 'phone' | 'role'>;
  driver?: Pick<Driver, 'id' | 'name' | 'phone' | 'isApproved' | 'status'>;
}
