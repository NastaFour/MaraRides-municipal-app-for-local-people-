import { FareEstimate } from '@mototaxi/shared';

// Constants for municipal mototaxi transit pricing
const EARTH_RADIUS_KM = 6371;
const URBAN_DETOUR_FACTOR = 1.3; // Street grid route multiplier vs straight line
const BASE_FARE = 1.50;          // Base flag drop in USD
const PER_KM_RATE = 0.80;        // Cost per kilometer in USD
const MIN_FARE = 2.00;           // Minimum trip fare
const AVERAGE_SPEED_KMH = 25;    // Average speed in urban municipal area

function toRadians(degrees: number): number {
  return degrees * (Math.PI / 180);
}

/**
 * Calculates distance in kilometers between two GPS coordinates using Haversine formula
 */
export function calculateDistanceKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) *
      Math.cos(toRadians(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const straightDistance = EARTH_RADIUS_KM * c;
  
  // Apply urban road factor
  const roadDistance = straightDistance * URBAN_DETOUR_FACTOR;
  return Math.round(roadDistance * 100) / 100;
}

/**
 * Calculates fare and estimated duration for a mototaxi trip
 */
export function calculateFare(
  originLat: number,
  originLng: number,
  destLat: number,
  destLng: number
): FareEstimate {
  const distanceKm = Math.max(0.3, calculateDistanceKm(originLat, originLng, destLat, destLng));
  const kmFare = Math.round(distanceKm * PER_KM_RATE * 100) / 100;
  const calculated = BASE_FARE + kmFare;
  const fare = Math.max(MIN_FARE, Math.round(calculated * 100) / 100);
  
  // Duration in minutes (distance / speed * 60 + 2 min buffer)
  const durationMin = Math.max(3, Math.round((distanceKm / AVERAGE_SPEED_KMH) * 60 + 2));

  return {
    distanceKm,
    durationMin,
    fare,
    baseFare: BASE_FARE,
    kmFare,
    currency: 'USD',
  };
}
