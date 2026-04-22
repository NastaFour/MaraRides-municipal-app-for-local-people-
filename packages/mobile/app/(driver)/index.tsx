import React, { useState, useEffect, useContext } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  Switch, Alert, ScrollView, ActivityIndicator
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import MapView, { Marker } from 'react-native-maps';
import * as Location from 'expo-location';
import { theme } from '../../src/theme/theme';
import { AuthContext } from '../../src/context/AuthContext';
import { request } from '../../src/services/api';
import { connectSocket, getSocket } from '../../src/services/socket';

export default function DriverDashboard() {
  const { user, logout } = useContext(AuthContext);
  const router = useRouter();
  const [isOnline, setIsOnline] = useState(false);
  const [location, setLocation] = useState<Location.LocationObject | null>(null);
  const [pendingTrips, setPendingTrips] = useState<any[]>([]);
  const [activeTrip, setActiveTrip] = useState<any>(null);
  const [loadingTripId, setLoadingTripId] = useState<string | null>(null);
  const [initializing, setInitializing] = useState(true);
  const [region, setRegion] = useState({
    latitude: 10.4806, longitude: -66.9036,
    latitudeDelta: 0.005, longitudeDelta: 0.005,
  });

  useEffect(() => {
    (async () => {
      // 1. Cargar viaje activo existente del conductor
      try {
        const trips = await request<any[]>('/trips');
        const existing = (trips as any[]).find((t: any) =>
          ['ACCEPTED', 'IN_PROGRESS'].includes(t.status)
        );
        if (existing) setActiveTrip(existing);
        
        // Cargar viajes REQUESTED disponibles
        const availableTrips = await request<any[]>('/trips?status=REQUESTED');
        if (Array.isArray(availableTrips)) setPendingTrips(availableTrips);
      } catch (_) {}

      // 2. GPS
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === 'granted') {
        const loc = await Location.getCurrentPositionAsync({});
        setLocation(loc);
        setRegion(prev => ({
          ...prev,
          latitude: loc.coords.latitude,
          longitude: loc.coords.longitude,
        }));
      }

      // 3. Socket
      if (user) {
        const socket = await connectSocket(user.id);
        socket.on('trip:new', (data: any) => {
          setPendingTrips(prev => {
            if (prev.find((t: any) => t.id === data.trip.id)) return prev;
            return [data.trip, ...prev];
          });
        });
        socket.on('trip:cancelled', (data: any) => {
          setPendingTrips(prev => prev.filter((t: any) => t.id !== data.tripId));
          setActiveTrip((cur: any) => {
            if (cur?.id === data.tripId) {
              Alert.alert('CANCELADO', 'El cliente canceló el viaje.');
              return null;
            }
            return cur;
          });
        });
      }

      setInitializing(false);
    })();

    return () => {
      const socket = getSocket();
      if (socket) { socket.off('trip:new'); socket.off('trip:cancelled'); }
    };
  }, [user]);

  const toggleOnline = async (value: boolean) => {
    const socket = getSocket();
    if (!socket) {
      Alert.alert('SIN SERVIDOR', 'No hay conexión. Recarga la app.');
      return;
    }
    if (value) {
      const u = user as any;
      if (!u?.isApproved) {
        Alert.alert('PENDIENTE', 'Tu cuenta no ha sido aprobada aún.');
        return;
      }
      socket.emit('driver:online');
      setIsOnline(true);
    } else {
      socket.emit('driver:offline');
      setIsOnline(false);
      setPendingTrips([]);
    }
  };

  const handleAcceptTrip = async (trip: any) => {
    setLoadingTripId(trip.id);
    try {
      const res = await request<any>(`/trips/${trip.id}/accept`, { method: 'PATCH' });
      setActiveTrip(res);
      setPendingTrips([]);
      Alert.alert('✓ ACEPTADO', `Recoge al cliente en: ${trip.originAddress ?? '—'}`);
    } catch (e: any) {
      Alert.alert('ERROR', e.message || 'No se pudo aceptar el viaje.');
    } finally {
      setLoadingTripId(null);
    }
  };

  const handleCompleteTrip = async () => {
    if (!activeTrip) return;
    try {
      await request(`/trips/${activeTrip.id}/complete`, { method: 'PATCH' });
      setActiveTrip(null);
      Alert.alert('✓ COMPLETADO', '¡Buen trabajo!');
    } catch (e: any) {
      Alert.alert('ERROR', e.message || 'Error al completar.');
    }
  };

  if (initializing) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.colors.accent} />
        <Text style={styles.loadingText}>Cargando datos...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <MapView
        style={styles.map}
        region={region}
        showsUserLocation
        showsMyLocationButton
        showsCompass
        mapPadding={{ top: 110, right: 0, bottom: 340, left: 0 }}
      >
        {location && (
          <Marker
            coordinate={{ latitude: location.coords.latitude, longitude: location.coords.longitude }}
            title="Mi posición"
          />
        )}
      </MapView>

      {/* BARRA SUPERIOR */}
      <SafeAreaView style={styles.topBarWrap} edges={['top']}>
        <View style={styles.topBar}>
          <View>
            <Text style={styles.topLabel}>OPERADOR</Text>
            <Text style={styles.topName}>{user?.name?.toUpperCase() ?? '—'}</Text>
          </View>
          <View style={styles.topActions}>
            <TouchableOpacity style={styles.historyBtn} onPress={() => router.push('/(driver)/history')}>
              <Text style={styles.historyTxt}>📋</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.logoutBtn} onPress={logout}>
              <Text style={styles.logoutTxt}>✕ SALIR</Text>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>

      {/* PANEL INFERIOR */}
      <View style={styles.overlay}>

        {/* Switch de estado */}
        <View style={styles.switchPanel}>
          <Text style={[styles.switchLabel, { color: isOnline ? theme.colors.accent : theme.colors.muted }]}>
            {isOnline ? '● EN LÍNEA — Recibiendo viajes' : '○ DESCONECTADO'}
          </Text>
          <Switch
            value={isOnline}
            onValueChange={toggleOnline}
            trackColor={{ false: '#2a2a2a', true: theme.colors.accent }}
            thumbColor={isOnline ? '#000' : '#666'}
          />
        </View>

        {/* Viaje activo */}
        {activeTrip && (
          <View style={styles.activeTripCard}>
            <Text style={styles.activeTripHeader}>🛵 VIAJE EN CURSO</Text>
            <Text style={styles.activeTripText}>
              Destino: {activeTrip.destAddress ?? '—'}
            </Text>
            {activeTrip.client && (
              <Text style={styles.activeTripText}>
                Cliente: {activeTrip.client.name}
              </Text>
            )}
            <TouchableOpacity style={styles.completeBtn} onPress={handleCompleteTrip}>
              <Text style={styles.completeBtnTxt}>[ MARCAR COMPLETADO ]</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Lista de solicitudes disponibles */}
        {!activeTrip && isOnline && pendingTrips.length > 0 && (
          <View style={styles.tripsCard}>
            <Text style={styles.tripsHeader}>// SOLICITUDES ({pendingTrips.length})</Text>
            <ScrollView style={{ maxHeight: 150 }} nestedScrollEnabled>
              {pendingTrips.map((trip) => (
                <View key={trip.id} style={styles.tripRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.tripOrigin} numberOfLines={1}>📌 {trip.originAddress}</Text>
                    <Text style={styles.tripDest} numberOfLines={1}>🏁 {trip.destAddress}</Text>
                  </View>
                  <TouchableOpacity
                    style={styles.acceptBtn}
                    onPress={() => handleAcceptTrip(trip)}
                    disabled={loadingTripId !== null}
                  >
                    {loadingTripId === trip.id
                      ? <ActivityIndicator size="small" color="#000" />
                      : <Text style={styles.acceptBtnTxt}>TOMAR</Text>
                    }
                  </TouchableOpacity>
                </View>
              ))}
            </ScrollView>
          </View>
        )}

        {/* Estado de espera */}
        {!activeTrip && (
          <View style={styles.waitCard}>
            <Text style={styles.waitTxt}>
              {!isOnline
                ? 'Activa el toggle para recibir viajes'
                : pendingTrips.length === 0
                  ? '⟳ Esperando solicitudes...'
                  : ''}
            </Text>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  loadingContainer: { flex: 1, backgroundColor: theme.colors.bg, justifyContent: 'center', alignItems: 'center', gap: 12 },
  loadingText: { color: theme.colors.muted, fontFamily: theme.fonts.mono, fontSize: 12 },
  container: { flex: 1, backgroundColor: '#000' },
  map: { ...StyleSheet.absoluteFillObject },
  topBarWrap: { position: 'absolute', top: 0, left: 0, right: 0 },
  topBar: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    backgroundColor: 'rgba(6,6,6,0.90)', marginHorizontal: 8, marginTop: 4,
    paddingHorizontal: 14, paddingVertical: 10, borderRadius: 8,
    borderWidth: 1, borderColor: theme.colors.border,
  },
  topLabel: { color: theme.colors.muted, fontFamily: theme.fonts.mono, fontSize: 9, letterSpacing: 2 },
  topName: { color: theme.colors.accent, fontFamily: theme.fonts.mono, fontSize: 13, fontWeight: 'bold' },
  topActions: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  historyBtn: {
    backgroundColor: 'rgba(0,200,200,0.12)', paddingHorizontal: 10, paddingVertical: 6,
    borderRadius: 6, borderWidth: 1, borderColor: theme.colors.cyan,
  },
  historyTxt: { fontSize: 14 },
  logoutBtn: {
    backgroundColor: 'rgba(200,40,40,0.18)', paddingHorizontal: 12, paddingVertical: 6,
    borderRadius: 6, borderWidth: 1, borderColor: theme.colors.danger,
  },
  logoutTxt: { color: theme.colors.danger, fontFamily: theme.fonts.mono, fontSize: 11, fontWeight: 'bold' },
  overlay: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: 12, gap: 8 },
  switchPanel: {
    backgroundColor: theme.colors.surface, padding: 14,
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    borderWidth: 1, borderColor: theme.colors.border, borderRadius: 4,
  },
  switchLabel: { fontFamily: theme.fonts.mono, fontSize: 11, fontWeight: 'bold', flex: 1, marginRight: 8 },
  activeTripCard: {
    backgroundColor: theme.colors.surface, padding: 14,
    borderLeftWidth: 4, borderLeftColor: theme.colors.accent,
    borderWidth: 1, borderColor: theme.colors.border, gap: 6,
  },
  activeTripHeader: { color: theme.colors.accent, fontFamily: theme.fonts.mono, fontSize: 13, fontWeight: 'bold' },
  activeTripText: { color: theme.colors.text, fontFamily: theme.fonts.mono, fontSize: 12 },
  completeBtn: { marginTop: 6, backgroundColor: theme.colors.accent, padding: 12, alignItems: 'center' },
  completeBtnTxt: { color: '#000', fontFamily: theme.fonts.mono, fontWeight: 'bold', fontSize: 12, letterSpacing: 1 },
  tripsCard: { backgroundColor: theme.colors.surface, borderWidth: 1, borderColor: theme.colors.border, padding: 12 },
  tripsHeader: { color: theme.colors.muted, fontFamily: theme.fonts.mono, fontSize: 10, marginBottom: 8, letterSpacing: 1 },
  tripRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: theme.colors.border, gap: 8,
  },
  tripOrigin: { color: theme.colors.muted, fontFamily: theme.fonts.mono, fontSize: 11 },
  tripDest: { color: theme.colors.text, fontFamily: theme.fonts.mono, fontSize: 12, fontWeight: 'bold', marginTop: 2 },
  acceptBtn: { backgroundColor: theme.colors.accent, paddingHorizontal: 14, paddingVertical: 10, minWidth: 72, alignItems: 'center', borderRadius: 2 },
  acceptBtnTxt: { color: '#000', fontFamily: theme.fonts.mono, fontWeight: 'bold', fontSize: 11 },
  waitCard: { backgroundColor: theme.colors.surface, padding: 14, alignItems: 'center', borderWidth: 1, borderColor: theme.colors.border },
  waitTxt: { color: theme.colors.muted, fontFamily: theme.fonts.mono, fontSize: 12 },
});
