import React, { useState, useEffect, useContext } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  Alert, ActivityIndicator
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import MapView, { Marker } from 'react-native-maps';
import * as Location from 'expo-location';
import { theme } from '../../src/theme/theme';
import { AuthContext } from '../../src/context/AuthContext';
import { request } from '../../src/services/api';
import { connectSocket, getSocket } from '../../src/services/socket';

export default function ClientDashboard() {
  const { user, logout } = useContext(AuthContext);
  const router = useRouter();
  const [location, setLocation] = useState<Location.LocationObject | null>(null);
  const [destination, setDestination] = useState<any>(null);
  const [activeTrip, setActiveTrip] = useState<any>(null);
  const [driverLocation, setDriverLocation] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [initializing, setInitializing] = useState(true);
  const [region, setRegion] = useState({
    latitude: 10.4806, longitude: -66.9036,
    latitudeDelta: 0.015, longitudeDelta: 0.015,
  });

  useEffect(() => {
    (async () => {
      // 1. Cargar viaje activo existente desde la API
      try {
        const trips = await request<any[]>('/trips');
        const existing = trips.find((t: any) =>
          ['REQUESTED', 'ACCEPTED', 'IN_PROGRESS'].includes(t.status)
        );
        if (existing) setActiveTrip(existing);
      } catch (_) {}

      // 2. Permisos GPS
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === 'granted') {
        const loc = await Location.getCurrentPositionAsync({});
        setLocation(loc);
        setRegion({
          latitude: loc.coords.latitude,
          longitude: loc.coords.longitude,
          latitudeDelta: 0.015, longitudeDelta: 0.015,
        });
      }

      // 3. Conectar socket
      if (user) {
        const socket = await connectSocket(user.id);
        socket.on('trip:accepted', (data: any) => {
          setActiveTrip((prev: any) => ({ ...(prev || {}), ...data.trip }));
          Alert.alert('VIAJE ACEPTADO', `Conductor ${data.trip.driver?.name ?? ''} en camino.`);
          socket.on(`driver:location:${data.trip.driverId}`, (coords: any) => {
            setDriverLocation(coords);
          });
        });
        socket.on('trip:completed', () => {
          setActiveTrip(null);
          setDriverLocation(null);
          setDestination(null);
          Alert.alert('COMPLETADO', 'Gracias por usar CityTransit.');
        });
      }

      setInitializing(false);
    })();

    return () => {
      const socket = getSocket();
      if (socket) socket.off('trip:accepted');
    };
  }, [user]);

  const requestRide = async () => {
    if (!location || !destination) {
      Alert.alert('SIN DESTINO', 'Toca el mapa para elegir tu destino.');
      return;
    }
    setLoading(true);
    try {
      const res = await request<any>('/trips', {
        method: 'POST',
        body: JSON.stringify({
          originLat: location.coords.latitude,
          originLng: location.coords.longitude,
          destLat: destination.latitude,
          destLng: destination.longitude,
          originAddress: 'Ubicación Actual',
          destAddress: 'Destino Seleccionado',
          fare: 5.00,
        }),
      });
      setActiveTrip(res);
      Alert.alert('✓ ENVIADO', 'Buscando conductor...');
    } catch (e: any) {
      Alert.alert('ERROR', e.message || 'No se pudo solicitar el viaje.');
    } finally {
      setLoading(false);
    }
  };

  const cancelRide = () => {
    if (!activeTrip) return;
    Alert.alert('CANCELAR', '¿Seguro que deseas cancelar?', [
      { text: 'No' },
      {
        text: 'Sí, cancelar', style: 'destructive',
        onPress: async () => {
          try {
            await request(`/trips/${activeTrip.id}/cancel`, { method: 'PATCH' });
            setActiveTrip(null);
            setDestination(null);
          } catch (e: any) {
            Alert.alert('ERROR', e.message || 'No se pudo cancelar.');
          }
        },
      },
    ]);
  };

  if (initializing) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.colors.accent} />
        <Text style={styles.loadingText}>Cargando...</Text>
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
        mapPadding={{ top: 110, right: 0, bottom: 270, left: 0 }}
        onPress={(e) => { if (!activeTrip) setDestination(e.nativeEvent.coordinate); }}
      >
        {destination && !activeTrip && (
          <Marker coordinate={destination} title="Tu destino" pinColor="#00FFFF" />
        )}
        {driverLocation && (
          <Marker coordinate={{ latitude: driverLocation.lat, longitude: driverLocation.lng }} title="Tu Mototaxi">
            <View style={styles.driverMarker} />
          </Marker>
        )}
      </MapView>

      {/* BARRA SUPERIOR */}
      <SafeAreaView style={styles.topBarWrap} edges={['top']}>
        <View style={styles.topBar}>
          <Text style={styles.topTitle}>CityTransit</Text>
          <View style={styles.topActions}>
            <TouchableOpacity style={styles.historyBtn} onPress={() => router.push('/(client)/history')}>
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
        <View style={styles.statusCard}>
          <Text style={styles.statusLabel}>
            {activeTrip ? '// VIAJE ACTIVO' : '// LISTO'}
          </Text>
          {activeTrip ? (
            <View>
              <Text style={styles.statusValue}>
                {activeTrip.status === 'REQUESTED' ? '⟳ BUSCANDO CONDUCTOR...'
                  : activeTrip.status === 'ACCEPTED' ? '🛵 CONDUCTOR EN CAMINO'
                  : '🛵 EN PROGRESO'}
              </Text>
              {activeTrip.driver && (
                <Text style={styles.driverInfo}>👤 {activeTrip.driver.name}</Text>
              )}
            </View>
          ) : (
            <Text style={styles.statusValue}>
              {destination ? '📍 Destino fijado' : 'Toca el mapa para elegir tu destino'}
            </Text>
          )}
        </View>

        {/* BOTÓN PRINCIPAL — alterna entre SOLICITAR y ABORTAR */}
        {activeTrip ? (
          <TouchableOpacity style={[styles.mainBtn, styles.abortBtn]} onPress={cancelRide}>
            <Text style={[styles.mainBtnTxt, { color: '#FFF' }]}>[ ABORTAR VIAJE ]</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={[styles.mainBtn, !destination && styles.mainBtnDisabled]}
            onPress={requestRide}
            disabled={loading || !destination}
          >
            {loading
              ? <ActivityIndicator color="#000" />
              : <Text style={styles.mainBtnTxt}>[ SOLICITAR MOTOTAXI ]</Text>
            }
          </TouchableOpacity>
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
    backgroundColor: 'rgba(6,6,6,0.88)', marginHorizontal: 8, marginTop: 4,
    paddingHorizontal: 14, paddingVertical: 10, borderRadius: 8,
    borderWidth: 1, borderColor: theme.colors.border,
  },
  topTitle: { color: theme.colors.accent, fontFamily: theme.fonts.mono, fontSize: 14, fontWeight: 'bold', letterSpacing: 2 },
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
  overlay: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: 14, gap: 10 },
  statusCard: {
    backgroundColor: theme.colors.surface, padding: 16,
    borderLeftWidth: 4, borderLeftColor: theme.colors.cyan,
    borderWidth: 1, borderColor: theme.colors.border,
  },
  statusLabel: { color: theme.colors.muted, fontFamily: theme.fonts.mono, fontSize: 10, marginBottom: 6, letterSpacing: 1 },
  statusValue: { color: theme.colors.text, fontFamily: theme.fonts.mono, fontSize: 15, fontWeight: '700' },
  driverInfo: { color: theme.colors.cyan, fontFamily: theme.fonts.mono, fontSize: 12, marginTop: 4 },
  mainBtn: { backgroundColor: theme.colors.accent, paddingVertical: 18, alignItems: 'center', borderWidth: 2, borderColor: '#000' },
  mainBtnDisabled: { opacity: 0.4 },
  abortBtn: { backgroundColor: theme.colors.danger, borderColor: '#500' },
  mainBtnTxt: { color: '#000', fontWeight: 'bold', fontSize: 16, fontFamily: theme.fonts.mono, letterSpacing: 2 },
  driverMarker: { width: 20, height: 20, backgroundColor: theme.colors.accent, borderWidth: 3, borderColor: '#000', borderRadius: 10 },
});
