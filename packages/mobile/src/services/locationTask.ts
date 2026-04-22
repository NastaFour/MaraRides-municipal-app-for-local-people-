import * as TaskManager from 'expo-task-manager';
import * as Location from 'expo-location';
import { getSocket } from './socket';

export const LOCATION_TASK_NAME = 'background-location-task';

TaskManager.defineTask(LOCATION_TASK_NAME, ({ data, error }: any) => {
  if (error) {
    console.error('[LOCATION_TASK] Error:', error);
    return;
  }
  if (data) {
    const { locations } = data;
    const location = locations[0];
    if (location) {
      const socket = getSocket();
      if (socket && socket.connected) {
        socket.emit('driver:location', {
          lat: location.coords.latitude,
          lng: location.coords.longitude,
        });
        console.log('[LOCATION_TASK] Coords emitted:', location.coords.latitude, location.coords.longitude);
      }
    }
  }
});

export const startBackgroundUpdate = async () => {
  const { status } = await Location.requestBackgroundPermissionsAsync();
  if (status !== 'granted') {
    console.error('[LOCATION_TASK] Background permission denied');
    return;
  }

  const isStarted = await Location.hasStartedLocationUpdatesAsync(LOCATION_TASK_NAME);
  if (!isStarted) {
    await Location.startLocationUpdatesAsync(LOCATION_TASK_NAME, {
      accuracy: Location.Accuracy.High,
      timeInterval: 10000, // 10 seconds
      distanceInterval: 10, // 10 meters
      foregroundService: {
        notificationTitle: 'MotoTaxi Active',
        notificationBody: 'Tu ubicación se está compartiendo en tiempo real.',
        notificationColor: '#CCFF00',
      },
    });
  }
};

export const stopBackgroundUpdate = async () => {
  const isStarted = await Location.hasStartedLocationUpdatesAsync(LOCATION_TASK_NAME);
  if (isStarted) {
    await Location.stopLocationUpdatesAsync(LOCATION_TASK_NAME);
  }
};
