import * as TaskManager from 'expo-task-manager';
import * as Location from 'expo-location';
import { getSocket } from './socket';

export const LOCATION_TASK_NAME = 'background-location-task';

TaskManager.defineTask(LOCATION_TASK_NAME, async ({ data, error }: any) => {
  if (error) {
    console.error('[LOCATION_TASK] Error:', error);
    return;
  }
  if (data) {
    const { locations } = data;
    const location = locations?.[0];
    if (location) {
      const socket = getSocket();
      if (socket && socket.connected) {
        socket.emit('driver:location', {
          lat: location.coords.latitude,
          lng: location.coords.longitude,
        });
      }
    }
  }
});

export const startBackgroundUpdate = async () => {
  try {
    const { status: fgStatus } = await Location.requestForegroundPermissionsAsync();
    if (fgStatus !== 'granted') {
      console.warn('[LOCATION_TASK] Foreground permission not granted');
      return false;
    }

    const { status: bgStatus } = await Location.requestBackgroundPermissionsAsync();
    if (bgStatus !== 'granted') {
      console.warn('[LOCATION_TASK] Background permission denied, falling back to foreground tracking');
      return false;
    }

    const isStarted = await Location.hasStartedLocationUpdatesAsync(LOCATION_TASK_NAME);
    if (!isStarted) {
      await Location.startLocationUpdatesAsync(LOCATION_TASK_NAME, {
        accuracy: Location.Accuracy.High,
        timeInterval: 10000,
        distanceInterval: 10,
        foregroundService: {
          notificationTitle: 'Mara Rides Conductor Activo',
          notificationBody: 'Tu ubicación se comparte en tiempo real con la central municipal.',
          notificationColor: '#F59E0B',
        },
      });
    }
    return true;
  } catch (err) {
    console.error('[LOCATION_TASK] Exception starting background location:', err);
    return false;
  }
};

export const stopBackgroundUpdate = async () => {
  const isStarted = await Location.hasStartedLocationUpdatesAsync(LOCATION_TASK_NAME);
  if (isStarted) {
    await Location.stopLocationUpdatesAsync(LOCATION_TASK_NAME);
  }
};
