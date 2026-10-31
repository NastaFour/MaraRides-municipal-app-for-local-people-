// ─── Enums ───────────────────────────────────────────────────────────────────

export enum Role {
  ADMIN = 'ADMIN',
  CLIENT = 'CLIENT',
  DRIVER = 'DRIVER',
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

export enum PaymentMethod {
  CASH = 'CASH',
  PAGO_MOVIL = 'PAGO_MOVIL',
  CARD = 'CARD',
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
  ratingAvg?: number;
  totalTrips?: number;
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

// ─── Rating ──────────────────────────────────────────────────────────────────

export interface Rating {
  id: string;
  tripId: string;
  score: number;
  comment?: string | null;
  clientId: string;
  driverId: string;
  createdAt: Date;
}

// ─── Trip ────────────────────────────────────────────────────────────────────

export interface Trip {
  id: string;
  clientId: string;
  client?: Pick<User, 'id' | 'name' | 'phone'>;
  driverId?: string | null;
  driver?: Pick<Driver, 'id' | 'name' | 'phone' | 'ratingAvg' | 'totalTrips' | 'latitude' | 'longitude'> | null;
  originLat: number;
  originLng: number;
  destLat: number;
  destLng: number;
  originAddress: string;
  destAddress: string;
  status: TripStatus;
  fare?: number | null;
  distanceKm?: number | null;
  durationMin?: number | null;
  paymentMethod: PaymentMethod;
  startedAt?: Date | null;
  completedAt?: Date | null;
  rating?: Rating | null;
  createdAt: Date;
}

// ─── Socket Event Payloads ───────────────────────────────────────────────────

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
  startedAt?: Date | string;
  completedAt?: Date | string;
}

export interface TripAcceptedPayload {
  trip: Trip;
}

export interface TripStartedPayload {
  trip: Trip;
}

export interface TripCompletedPayload {
  trip: Trip;
}

export interface TripRatedPayload {
  tripId: string;
  rating: Rating;
}

// ─── API Requests & Responses ────────────────────────────────────────────────

export interface CreateTripRequest {
  originLat: number;
  originLng: number;
  destLat: number;
  destLng: number;
  originAddress: string;
  destAddress: string;
  paymentMethod?: PaymentMethod;
}

export interface CreateRatingRequest {
  score: number;
  comment?: string;
}

export interface FareEstimate {
  distanceKm: number;
  durationMin: number;
  fare: number;
  baseFare: number;
  kmFare: number;
  currency: string;
}

export interface ApiSuccess<T> {
  success: true;
  data: T;
  message?: string;
}

export interface ApiError {
  success: false;
  message: string;
  errors?: Record<string, string[]>;
}

export type ApiResponse<T> = ApiSuccess<T> | ApiError;

// ─── Auth ────────────────────────────────────────────────────────────────────

export interface AuthPayload {
  token: string;
  user?: Pick<User, 'id' | 'name' | 'phone' | 'role'>;
  driver?: Pick<Driver, 'id' | 'name' | 'phone' | 'isApproved' | 'status' | 'ratingAvg'>;
}
