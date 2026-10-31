import React, { useState, useEffect, useContext } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Switch,
  Alert,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import MapView, { Marker } from 'react-native-maps';
import * as Location from 'expo-location';
import * as Haptics from 'expo-haptics';
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
  const [processingAction, setProcessingAction] = useState(false);
  const [initializing, setInitializing] = useState(true);

  const [region, setRegion] = useState({
    latitude: 10.7289,
    longitude: -71.7456,
    latitudeDelta: 0.015,
    longitudeDelta: 0.015,
  });

  useEffect(() => {
    let locationSubscription: Location.LocationSubscription | null = null;

    (async () => {
      // 1. Fetch current active trip
      try {
        const trips = await request<any[]>('/trips');
        const existing = trips.find((t: any) =>
          ['ACCEPTED', 'IN_PROGRESS'].includes(t.status)
        );
        if (existing) setActiveTrip(existing);

        const available = await request<any[]>('/trips?status=REQUESTED');
        if (Array.isArray(available)) setPendingTrips(available);
      } catch (_) {}

      // 2. Request GPS & Start Continuous Telemetry
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === 'granted') {
        const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
        setLocation(loc);
        setRegion({
          latitude: loc.coords.latitude,
          longitude: loc.coords.longitude,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        });

        // Watch location to stream live GPS
        locationSubscription = await Location.watchPositionAsync(
          { accuracy: Location.Accuracy.High, timeInterval: 4000, distanceInterval: 5 },
          (newLoc) => {
            setLocation(newLoc);
            const socket = getSocket();
            if (socket?.connected && isOnline) {
              socket.emit('driver:location', {
                lat: newLoc.coords.latitude,
                lng: newLoc.coords.longitude,
                tripId: activeTrip?.id,
              });
            }
          }
        );
      }

      // 3. Connect Socket Events
      if (user) {
        const socket = await connectSocket(user.id);

        socket.on('trip:new', (data: any) => {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
          setPendingTrips(prev => {
            if (prev.find(t => t.id === data.trip.id)) return prev;
            return [data.trip, ...prev];
          });
        });

        socket.on('trip:cancelled', (data: any) => {
          setPendingTrips(prev => prev.filter(t => t.id !== data.tripId));
          setActiveTrip((cur: any) => {
            if (cur?.id === data.tripId) {
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
              Alert.alert('Viaje Cancelado', 'El cliente canceló la solicitud.');
              return null;
            }
            return cur;
          });
        });
      }

      setInitializing(false);
    })();

    return () => {
      if (locationSubscription) locationSubscription.remove();
      const socket = getSocket();
      if (socket) {
        socket.off('trip:new');
        socket.off('trip:cancelled');
      }
    };
  }, [user, isOnline, activeTrip]);

  const toggleOnline = async (value: boolean) => {
    const socket = getSocket();
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    if (!socket) {
      Alert.alert('Sin Conexión', 'No se pudo conectar con la central de transporte.');
      return;
    }

    if (value) {
      const u = user as any;
      if (!u?.isApproved) {
        Alert.alert(
          'Revisión Municipal Pendiente',
          'Tu cuenta de mototaxista está en proceso de verificación por la Dirección de Transporte.'
        );
        return;
      }
      socket.emit('driver:online');
      setIsOnline(true);
      if (location) {
        socket.emit('driver:location', {
          lat: location.coords.latitude,
          lng: location.coords.longitude,
        });
      }
    } else {
      socket.emit('driver:offline');
      setIsOnline(false);
      setPendingTrips([]);
    }
  };

  const handleAcceptTrip = async (trip: any) => {
    setLoadingTripId(trip.id);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);

    try {
      const res = await request<any>(`/trips/${trip.id}/accept`, { method: 'PATCH' });
      setActiveTrip(res);
      setPendingTrips([]);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert('¡Carrera Tomada!', `Dirígete a: ${trip.originAddress ?? 'Punto de recogida'}`);
    } catch (e: any) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert('No Disponible', e.message || 'La carrera ya fue tomada por otro compañero.');
    } finally {
      setLoadingTripId(null);
    }
  };

  const handleStartTrip = async () => {
    if (!activeTrip) return;
    setProcessingAction(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    try {
      const res = await request<any>(`/trips/${activeTrip.id}/start`, { method: 'PATCH' });
      setActiveTrip(res);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (e: any) {
      Alert.alert('Error', e.message || 'No se pudo iniciar el viaje.');
    } finally {
      setProcessingAction(false);
    }
  };

  const handleCompleteTrip = async () => {
    if (!activeTrip) return;
    setProcessingAction(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);

    try {
      await request(`/trips/${activeTrip.id}/complete`, { method: 'PATCH' });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert('¡Carrera Finalizada!', `Cobro total: $${activeTrip.fare?.toFixed(2) ?? '0.00'}`);
      setActiveTrip(null);
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Error al completar el viaje.');
    } finally {
      setProcessingAction(false);
    }
  };

  if (initializing) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.colors.accent} />
        <Text style={styles.loadingText}>Conectando a central de mototaxis...</Text>
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
      >
        {location && (
          <Marker
            coordinate={{ latitude: location.coords.latitude, longitude: location.coords.longitude }}
            title="Mi Mototaxi"
          >
            <View style={styles.myMototaxiPin}>
              <Text style={{ fontSize: 16 }}>🏍</Text>
            </View>
          </Marker>
        )}
      </MapView>

      {/* Top Floating App Header */}
      <SafeAreaView style={styles.topBarWrap} edges={['top']}>
        <View style={styles.topBar}>
          <View style={styles.brandTitleWrap}>
            <Text style={styles.topBrand}>MARA<Text style={styles.topBrandAccent}>RIDES</Text></Text>
            <Text style={styles.driverTag}>CONDUCTOR</Text>
          </View>
          <View style={styles.topActions}>
            <TouchableOpacity
              style={styles.actionBtn}
              onPress={() => router.push('/(driver)/history')}
            >
              <Text style={styles.actionBtnText}>Ganancias</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.logoutBtn} onPress={logout}>
              <Text style={styles.logoutBtnText}>Salir</Text>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>

      {/* Bottom Controls */}
      <View style={styles.bottomOverlay}>
        {/* UNAPPROVED BANNER */}
        {!(user as any)?.isApproved && (
          <View style={styles.unapprovedCard}>
            <Text style={styles.unapprovedTitle}>⚠️ Aprobación Municipal Pendiente</Text>
            <Text style={styles.unapprovedText}>
              Tu cuenta de mototaxista está en revisión por la Dirección de Transporte del Municipio Mara. Una vez aprobada, podrás activar el servicio.
            </Text>
          </View>
        )}

        {/* ONLINE / OFFLINE TOGGLE CARD */}
        <View style={styles.statusCard}>
          <View style={styles.statusRow}>
            <View style={styles.statusIndicatorBox}>
              <View style={[styles.statusDot, { backgroundColor: isOnline ? theme.colors.success : theme.colors.muted }]} />
              <View>
                <Text style={styles.statusTitle}>
                  {isOnline ? 'Disponible en la central' : 'Fuera de servicio'}
                </Text>
                <Text style={styles.statusSubtitle}>
                  {isOnline ? 'Recibiendo solicitudes de pasajeros' : 'Activa el switch para recibir carreras'}
                </Text>
              </View>
            </View>
            <Switch
              value={isOnline}
              onValueChange={toggleOnline}
              trackColor={{ false: theme.colors.border, true: theme.colors.success }}
              thumbColor={isOnline ? '#FFF' : theme.colors.muted}
            />
          </View>
        </View>

        {/* ACTIVE TRIP SHEET */}
        {activeTrip && (
          <View style={styles.activeTripCard}>
            <View style={styles.activeTripHeader}>
              <View style={styles.pulseActive} />
              <Text style={styles.activeTripTitle}>
                {activeTrip.status === 'ACCEPTED' ? 'CARRERA ACEPTADA' : 'CARRERA EN RUTA'}
              </Text>
            </View>

            <View style={styles.tripRouteBox}>
              <View style={styles.routeItem}>
                <Text style={styles.routeLabel}>RECOGER EN:</Text>
                <Text style={styles.routeValue}>📍 {activeTrip.originAddress}</Text>
              </View>
              <View style={styles.routeItem}>
                <Text style={styles.routeLabel}>DESTINO:</Text>
                <Text style={styles.routeValue}>🏁 {activeTrip.destAddress}</Text>
              </View>
              {activeTrip.client && (
                <View style={styles.clientRow}>
                  <Text style={styles.clientText}>👤 Pasajero: {activeTrip.client.name}</Text>
                  <Text style={styles.fareHighlight}>${activeTrip.fare?.toFixed(2)}</Text>
                </View>
              )}
            </View>

            {/* Step-by-Step Transition Buttons */}
            {activeTrip.status === 'ACCEPTED' ? (
              <TouchableOpacity
                style={styles.btnActionPrimary}
                onPress={handleStartTrip}
                disabled={processingAction}
              >
                {processingAction ? (
                  <ActivityIndicator color={theme.colors.textDark} />
                ) : (
                  <Text style={styles.btnActionText}>Llegué al origen · Iniciar Viaje</Text>
                )}
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                style={[styles.btnActionPrimary, { backgroundColor: theme.colors.success }]}
                onPress={handleCompleteTrip}
                disabled={processingAction}
              >
                {processingAction ? (
                  <ActivityIndicator color={theme.colors.textDark} />
                ) : (
                  <Text style={styles.btnActionText}>Completar y Cobrar Carrera</Text>
                )}
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* PENDING REQUESTS LIST */}
        {!activeTrip && isOnline && pendingTrips.length > 0 && (
          <View style={styles.pendingCard}>
            <Text style={styles.pendingHeader}>
              Solicitudes cercanas ({pendingTrips.length})
            </Text>
            <ScrollView style={{ maxHeight: 180 }} nestedScrollEnabled>
              {pendingTrips.map((trip) => (
                <View key={trip.id} style={styles.requestItem}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.reqDestination} numberOfLines={1}>
                      🏁 {trip.destAddress}
                    </Text>
                    <Text style={styles.reqOrigin} numberOfLines={1}>
                      📍 Desde: {trip.originAddress}
                    </Text>
                    <Text style={styles.reqDistance}>
                      Tarifa oficial: <Text style={{ color: theme.colors.accent, fontWeight: '700' }}>${trip.fare?.toFixed(2)}</Text>
                    </Text>
                  </View>
                  <TouchableOpacity
                    style={styles.btnTakeTrip}
                    onPress={() => handleAcceptTrip(trip)}
                    disabled={loadingTripId !== null}
                  >
                    {loadingTripId === trip.id ? (
                      <ActivityIndicator size="small" color={theme.colors.textDark} />
                    ) : (
                      <Text style={styles.btnTakeTripText}>Tomar</Text>
                    )}
                  </TouchableOpacity>
                </View>
              ))}
            </ScrollView>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.bg },
  loadingContainer: { flex: 1, backgroundColor: theme.colors.bg, justifyContent: 'center', alignItems: 'center', gap: 10 },
  loadingText: { color: theme.colors.muted, fontSize: 13 },
  map: { ...StyleSheet.absoluteFillObject },
  topBarWrap: { position: 'absolute', top: 0, left: 0, right: 0, zIndex: 10 },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginHorizontal: 16,
    marginTop: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: theme.borderRadius.xl,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
    ...theme.shadows.float,
  },
  brandTitleWrap: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  topBrand: { color: theme.colors.text, fontSize: 16, fontWeight: '900' },
  topBrandAccent: { color: theme.colors.accent },
  driverTag: {
    backgroundColor: theme.colors.accentGlow,
    color: theme.colors.accent,
    fontSize: 9,
    fontWeight: '800',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: theme.borderRadius.full,
    borderWidth: 1,
    borderColor: theme.colors.accent,
  },
  topActions: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  actionBtn: {
    backgroundColor: theme.colors.elevated,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  actionBtnText: { color: theme.colors.textSecondary, fontSize: 12, fontWeight: '600' },
  logoutBtn: { paddingHorizontal: 8, paddingVertical: 6 },
  logoutBtnText: { color: theme.colors.danger, fontSize: 12, fontWeight: '600' },
  bottomOverlay: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: 16, gap: 10 },
  statusCard: {
    backgroundColor: theme.colors.surface,
    padding: 16,
    borderRadius: theme.borderRadius.xl,
    borderWidth: 1,
    borderColor: theme.colors.border,
    ...theme.shadows.card,
  },
  statusRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  statusIndicatorBox: { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 },
  statusDot: { width: 10, height: 10, borderRadius: 5 },
  statusTitle: { color: theme.colors.text, fontSize: 14, fontWeight: '700' },
  statusSubtitle: { color: theme.colors.muted, fontSize: 11, marginTop: 1 },
  activeTripCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.xl,
    padding: 18,
    borderWidth: 1,
    borderColor: theme.colors.accent,
    ...theme.shadows.float,
  },
  activeTripHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  pulseActive: { width: 8, height: 8, borderRadius: 4, backgroundColor: theme.colors.accent },
  activeTripTitle: { color: theme.colors.accent, fontSize: 13, fontWeight: '800' },
  tripRouteBox: {
    backgroundColor: theme.colors.elevated,
    borderRadius: theme.borderRadius.lg,
    padding: 12,
    gap: 8,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  routeItem: { gap: 2 },
  routeLabel: { color: theme.colors.muted, fontSize: 10, fontWeight: '700' },
  routeValue: { color: theme.colors.text, fontSize: 13, fontWeight: '600' },
  clientRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
    paddingTop: 8,
    marginTop: 4,
  },
  clientText: { color: theme.colors.textSecondary, fontSize: 12, fontWeight: '600' },
  fareHighlight: { color: theme.colors.accent, fontSize: 16, fontWeight: '900' },
  btnActionPrimary: {
    backgroundColor: theme.colors.accent,
    paddingVertical: 14,
    borderRadius: theme.borderRadius.md,
    alignItems: 'center',
  },
  btnActionText: { color: theme.colors.textDark, fontSize: 14, fontWeight: '800' },
  pendingCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.xl,
    padding: 16,
    borderWidth: 1,
    borderColor: theme.colors.border,
    ...theme.shadows.card,
  },
  pendingHeader: { color: theme.colors.text, fontSize: 13, fontWeight: '800', marginBottom: 10 },
  requestItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  reqDestination: { color: theme.colors.text, fontSize: 13, fontWeight: '700' },
  reqOrigin: { color: theme.colors.muted, fontSize: 11, marginTop: 2 },
  reqDistance: { color: theme.colors.textSecondary, fontSize: 11, marginTop: 2 },
  btnTakeTrip: {
    backgroundColor: theme.colors.accent,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: theme.borderRadius.md,
  },
  btnTakeTripText: { color: theme.colors.textDark, fontWeight: '800', fontSize: 13 },
  myMototaxiPin: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.accent,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  unapprovedCard: {
    backgroundColor: '#451A03',
    borderColor: '#F59E0B',
    borderWidth: 1,
    borderRadius: theme.borderRadius.lg,
    padding: 12,
    marginBottom: 10,
  },
  unapprovedTitle: {
    color: '#FCD34D',
    fontSize: 13,
    fontWeight: '800',
    marginBottom: 4,
  },
  unapprovedText: {
    color: '#FDE68A',
    fontSize: 12,
    lineHeight: 16,
  },
});
