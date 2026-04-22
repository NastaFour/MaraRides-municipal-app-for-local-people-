// ============================================================
// useSocket — packages/dashboard
// Subscribes to socket.io-client events with automatic cleanup
// ============================================================

import { useEffect } from 'react';
import { getSocket, SOCKET_EVENTS, DriverLocationPayload } from '../services/socket';

// ── Generic event hook ──
export function useSocketEvent<T = unknown>(
  event: string,
  handler: (data: T) => void
): void {
  useEffect(() => {
    const socket = getSocket();
    socket.on(event, handler);
    return () => {
      socket.off(event, handler);
    };
  }, [event, handler]);
}

// ── Typed convenience hook for driver:location ──
export function useDriverLocations(
  onLocation: (payload: DriverLocationPayload) => void
): void {
  useSocketEvent<DriverLocationPayload>(SOCKET_EVENTS.DRIVER_LOCATION, onLocation);
}

// ── Typed convenience hook for new trips ──
export function useNewTrips(onTrip: (trip: unknown) => void): void {
  useSocketEvent(SOCKET_EVENTS.TRIP_NEW, onTrip);
}

export { SOCKET_EVENTS };
