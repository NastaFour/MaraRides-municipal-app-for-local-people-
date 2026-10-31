import React, { useState, useEffect, useContext } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Modal,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import MapView, { Marker, Polyline } from 'react-native-maps';
import * as Location from 'expo-location';
import * as Haptics from 'expo-haptics';
import { theme } from '../../src/theme/theme';
import { AuthContext } from '../../src/context/AuthContext';
import { request } from '../../src/services/api';
import { connectSocket, getSocket } from '../../src/services/socket';

export default function ClientDashboard() {
  const { user, logout } = useContext(AuthContext);
  const router = useRouter();

  const [location, setLocation] = useState<Location.LocationObject | null>(null);
  const [destination, setDestination] = useState<{ latitude: number; longitude: number } | null>(null);
  const [activeTrip, setActiveTrip] = useState<any>(null);
  const [driverLocation, setDriverLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [fareEstimate, setFareEstimate] = useState<any>(null);
  const [paymentMethod, setPaymentMethod] = useState<'CASH' | 'PAGO_MOVIL'>('CASH');
  const [loading, setLoading] = useState(false);
  const [estimating, setEstimating] = useState(false);
  const [initializing, setInitializing] = useState(true);

  // Rating modal state
  const [ratingModalVisible, setRatingModalVisible] = useState(false);
  const [completedTripId, setCompletedTripId] = useState<string | null>(null);
  const [ratingScore, setRatingScore] = useState(5);
  const [ratingComment, setRatingComment] = useState('');
  const [submittingRating, setSubmittingRating] = useState(false);

  const [region, setRegion] = useState({
    latitude: 10.7289,
    longitude: -71.7456, // Mara Municipality, Zulia
    latitudeDelta: 0.02,
    longitudeDelta: 0.02,
  });

  useEffect(() => {
    (async () => {
      // 1. Load existing active trip
      try {
        const trips = await request<any[]>('/trips');
        const existing = trips.find((t: any) =>
          ['REQUESTED', 'ACCEPTED', 'IN_PROGRESS'].includes(t.status)
        );
        if (existing) {
          setActiveTrip(existing);
          if (existing.driver?.latitude && existing.driver?.longitude) {
            setDriverLocation({ lat: existing.driver.latitude, lng: existing.driver.longitude });
          }
        }
      } catch (_) {}

      // 2. Request GPS Permission with Municipal Center fallback
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status === 'granted') {
          const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
          setLocation(loc);
          setRegion({
            latitude: loc.coords.latitude,
            longitude: loc.coords.longitude,
            latitudeDelta: 0.015,
            longitudeDelta: 0.015,
          });
        } else {
          // Default to Mara Municipality center
          setLocation({
            coords: {
              latitude: 10.7289,
              longitude: -71.7456,
              altitude: null,
              accuracy: 10,
              altitudeAccuracy: null,
              heading: null,
              speed: null,
            },
            timestamp: Date.now(),
          } as any);
        }
      } catch (err) {
        console.warn('GPS location lock failed, using Mara fallback:', err);
        setLocation({
          coords: {
            latitude: 10.7289,
            longitude: -71.7456,
            altitude: null,
            accuracy: 10,
            altitudeAccuracy: null,
            heading: null,
            speed: null,
          },
          timestamp: Date.now(),
        } as any);
      }

      // 3. Connect real-time socket
      if (user) {
        const socket = await connectSocket(user.id);

        socket.on('trip:accepted', (data: any) => {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          setActiveTrip(data.trip);
          if (data.trip?.driver?.latitude) {
            setDriverLocation({ lat: data.trip.driver.latitude, lng: data.trip.driver.longitude });
          }
        });

        socket.on('trip:started', (data: any) => {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          setActiveTrip(data.trip);
        });

        socket.on('trip:driver_location', (data: any) => {
          setDriverLocation({ lat: data.lat, lng: data.lng });
        });

        socket.on('trip:completed', (data: any) => {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          const finishedTrip = data?.trip || activeTrip;
          setCompletedTripId(finishedTrip?.id ?? null);
          setActiveTrip(null);
          setDestination(null);
          setDriverLocation(null);
          setRatingModalVisible(true);
        });
      }

      setInitializing(false);
    })();

    return () => {
      const socket = getSocket();
      if (socket) {
        socket.off('trip:accepted');
        socket.off('trip:started');
        socket.off('trip:driver_location');
        socket.off('trip:completed');
      }
    };
  }, [user]);

  // When client taps map, calculate real fare
  const handleMapPress = async (coordinate: { latitude: number; longitude: number }) => {
    if (activeTrip) return;
    Haptics.selectionAsync();
    setDestination(coordinate);

    if (location) {
      setEstimating(true);
      try {
        const est = await request<any>('/trips/estimate', {
          method: 'POST',
          body: JSON.stringify({
            originLat: location.coords.latitude,
            originLng: location.coords.longitude,
            destLat: coordinate.latitude,
            destLng: coordinate.longitude,
          }),
        });
        setFareEstimate(est);
      } catch (e) {
        console.error('Error calculando estimado:', e);
      } finally {
        setEstimating(false);
      }
    }
  };

  const requestRide = async () => {
    if (!location || !destination) {
      Alert.alert('Elige tu destino', 'Toca el mapa en el lugar hacia donde deseas viajar.');
      return;
    }

    setLoading(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    try {
      const res = await request<any>('/trips', {
        method: 'POST',
        body: JSON.stringify({
          originLat: location.coords.latitude,
          originLng: location.coords.longitude,
          destLat: destination.latitude,
          destLng: destination.longitude,
          originAddress: 'Mi Ubicación Actual',
          destAddress: 'Destino en el Municipio',
          paymentMethod,
        }),
      });

      setActiveTrip(res);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (e: any) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert('Error', e.message || 'No se pudo solicitar la mototaxi.');
    } finally {
      setLoading(false);
    }
  };

  const cancelRide = () => {
    if (!activeTrip) return;
    Alert.alert('Cancelar viaje', '¿Seguro que deseas abortar tu solicitud de mototaxi?', [
      { text: 'No, esperar', style: 'cancel' },
      {
        text: 'Sí, cancelar',
        style: 'destructive',
        onPress: async () => {
          try {
            await request(`/trips/${activeTrip.id}/cancel`, { method: 'PATCH' });
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
            setActiveTrip(null);
            setDestination(null);
          } catch (e: any) {
            Alert.alert('Error', e.message || 'No se pudo cancelar el viaje.');
          }
        },
      },
    ]);
  };

  const submitRating = async () => {
    if (!completedTripId) {
      setRatingModalVisible(false);
      return;
    }

    setSubmittingRating(true);
    try {
      await request(`/trips/${completedTripId}/rate`, {
        method: 'POST',
        body: JSON.stringify({ score: ratingScore, comment: ratingComment }),
      });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert('¡Gracias!', 'Tu calificación ayuda a mantener el servicio seguro.');
    } catch (e: any) {
      console.error(e);
    } finally {
      setSubmittingRating(false);
      setRatingModalVisible(false);
      setCompletedTripId(null);
      setRatingComment('');
    }
  };

  if (initializing) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.colors.accent} />
        <Text style={styles.loadingText}>Iniciando GPS satelital...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Map View */}
      <MapView
        style={styles.map}
        region={region}
        showsUserLocation
        showsMyLocationButton
        showsCompass
        onPress={(e) => handleMapPress(e.nativeEvent.coordinate)}
      >
        {destination && !activeTrip && (
          <Marker
            coordinate={destination}
            title="Destino"
            pinColor={theme.colors.accent}
          />
        )}

        {driverLocation && (
          <Marker
            coordinate={{ latitude: driverLocation.lat, longitude: driverLocation.lng }}
            title="Tu Mototaxi"
          >
            <View style={styles.driverPin}>
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
            <Text style={styles.topBadge}>PASAJERO</Text>
          </View>
          <View style={styles.topActions}>
            <TouchableOpacity
              style={styles.actionBtn}
              onPress={() => router.push('/(client)/history')}
            >
              <Text style={styles.actionBtnText}>Mis Viajes</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.logoutBtn} onPress={logout}>
              <Text style={styles.logoutBtnText}>Salir</Text>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>

      {/* Bottom Floating Control Sheet */}
      <View style={styles.bottomSheet}>
        {activeTrip ? (
          /* ACTIVE TRIP STATUS CARD */
          <View style={styles.card}>
            <View style={styles.activeHeader}>
              <View style={styles.pulseDot} />
              <Text style={styles.activeStatusText}>
                {activeTrip.status === 'REQUESTED' && 'Buscando mototaxi cercano...'}
                {activeTrip.status === 'ACCEPTED' && '¡Conductor en camino a recogerte!'}
                {activeTrip.status === 'IN_PROGRESS' && 'Viaje en curso hacia el destino'}
              </Text>
            </View>

            {activeTrip.driver ? (
              <View style={styles.driverProfileBox}>
                <View style={styles.driverAvatar}>
                  <Text style={{ fontSize: 20 }}>👤</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.driverName}>{activeTrip.driver.name}</Text>
                  <Text style={styles.driverVehicle}>
                    {activeTrip.driver.vehicle?.model ?? 'Mototaxi'} · Placa: {activeTrip.driver.vehicle?.plate ?? '—'}
                  </Text>
                  <Text style={styles.driverRating}>
                    ⭐ {((activeTrip.driver.ratingAvg ?? 5.0)).toFixed(1)} de valoración
                  </Text>
                </View>
                <View style={styles.fareTag}>
                  <Text style={styles.fareAmount}>${activeTrip.fare?.toFixed(2) ?? '2.00'}</Text>
                </View>
              </View>
            ) : (
              <View style={styles.searchingRow}>
                <ActivityIndicator size="small" color={theme.colors.accent} />
                <Text style={styles.searchingText}>
                  Notificando a mototaxistas en el área...
                </Text>
              </View>
            )}

            <TouchableOpacity style={styles.btnAbort} onPress={cancelRide}>
              <Text style={styles.btnAbortText}>Cancelar Solicitud</Text>
            </TouchableOpacity>
          </View>
        ) : (
          /* REQUEST NEW RIDE SHEET */
          <View style={styles.card}>
            <Text style={styles.sheetTitle}>
              {destination ? 'Confirma tu carrera' : '¿A dónde quieres ir hoy?'}
            </Text>
            <Text style={styles.sheetSubtitle}>
              {destination
                ? 'Tarifa oficial municipal calculada por distancia'
                : 'Toca un punto en el mapa para fijar tu destino'}
            </Text>

            {destination && (
              <View style={styles.estimateBox}>
                {estimating ? (
                  <ActivityIndicator size="small" color={theme.colors.accent} />
                ) : (
                  fareEstimate && (
                    <View style={styles.estimateRow}>
                      <View>
                        <Text style={styles.estimateDistance}>
                          {fareEstimate.distanceKm} km · aprox. {fareEstimate.durationMin} min
                        </Text>
                        <Text style={styles.estimateNote}>Tarifa regulada por el Municipio</Text>
                      </View>
                      <View style={styles.priceBadge}>
                        <Text style={styles.priceText}>${fareEstimate.fare.toFixed(2)}</Text>
                      </View>
                    </View>
                  )
                )}

                {/* Payment Method Selector */}
                <View style={styles.paymentSelector}>
                  <TouchableOpacity
                    style={[styles.payOption, paymentMethod === 'CASH' && styles.payOptionActive]}
                    onPress={() => setPaymentMethod('CASH')}
                  >
                    <Text style={[styles.payText, paymentMethod === 'CASH' && styles.payTextActive]}>
                      💵 Efectivo
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.payOption, paymentMethod === 'PAGO_MOVIL' && styles.payOptionActive]}
                    onPress={() => setPaymentMethod('PAGO_MOVIL')}
                  >
                    <Text style={[styles.payText, paymentMethod === 'PAGO_MOVIL' && styles.payTextActive]}>
                      📱 Pago Móvil
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}

            <TouchableOpacity
              style={[styles.btnOrder, (!destination || loading) && styles.btnDisabled]}
              onPress={requestRide}
              disabled={!destination || loading}
              activeOpacity={0.8}
            >
              {loading ? (
                <ActivityIndicator color={theme.colors.textDark} />
              ) : (
                <Text style={styles.btnOrderText}>
                  {destination ? 'Pedir Mototaxi Ahora' : 'Elige tu destino en el mapa'}
                </Text>
              )}
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* RATING MODAL (POST-TRIP) */}
      <Modal visible={ratingModalVisible} transparent animationType="slide">
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={{ fontSize: 36, textAlign: 'center', marginBottom: 8 }}>⭐</Text>
            <Text style={styles.modalTitle}>¡Llegaste a tu destino!</Text>
            <Text style={styles.modalSubtitle}>¿Cómo estuvo el servicio del mototaxista?</Text>

            {/* Star Selector */}
            <View style={styles.starRow}>
              {[1, 2, 3, 4, 5].map((star) => (
                <TouchableOpacity
                  key={star}
                  onPress={() => {
                    Haptics.selectionAsync();
                    setRatingScore(star);
                  }}
                  style={styles.starBtn}
                >
                  <Text style={[styles.starIcon, ratingScore >= star && styles.starIconActive]}>
                    ★
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <TextInput
              style={styles.commentInput}
              placeholder="Deja un comentario opcional sobre el viaje..."
              placeholderTextColor={theme.colors.muted}
              value={ratingComment}
              onChangeText={setRatingComment}
              multiline
              maxLength={140}
            />

            <TouchableOpacity
              style={styles.btnSubmitRating}
              onPress={submitRating}
              disabled={submittingRating}
            >
              {submittingRating ? (
                <ActivityIndicator color={theme.colors.textDark} size="small" />
              ) : (
                <Text style={styles.btnSubmitRatingText}>Enviar Calificación</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
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
  topBadge: {
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
  bottomSheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
  },
  card: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.xl,
    padding: 20,
    borderWidth: 1,
    borderColor: theme.colors.border,
    ...theme.shadows.float,
  },
  sheetTitle: { fontSize: 17, fontWeight: '800', color: theme.colors.text },
  sheetSubtitle: { fontSize: 12, color: theme.colors.muted, marginTop: 2, marginBottom: 14 },
  estimateBox: {
    backgroundColor: theme.colors.elevated,
    borderRadius: theme.borderRadius.lg,
    padding: 14,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  estimateRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  estimateDistance: { fontSize: 13, fontWeight: '700', color: theme.colors.text },
  estimateNote: { fontSize: 11, color: theme.colors.muted, marginTop: 2 },
  priceBadge: {
    backgroundColor: theme.colors.accent,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: theme.borderRadius.md,
  },
  priceText: { color: theme.colors.textDark, fontWeight: '900', fontSize: 15 },
  paymentSelector: { flexDirection: 'row', gap: 10, marginTop: 12 },
  payOption: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: theme.borderRadius.sm,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  payOptionActive: {
    borderColor: theme.colors.accent,
    backgroundColor: theme.colors.accentGlow,
  },
  payText: { fontSize: 12, color: theme.colors.muted, fontWeight: '600' },
  payTextActive: { color: theme.colors.accent },
  btnOrder: {
    backgroundColor: theme.colors.accent,
    paddingVertical: 15,
    borderRadius: theme.borderRadius.md,
    alignItems: 'center',
    ...theme.shadows.card,
  },
  btnDisabled: { opacity: 0.5 },
  btnOrderText: { color: theme.colors.textDark, fontSize: 15, fontWeight: '800' },
  activeHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 14 },
  pulseDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: theme.colors.accent },
  activeStatusText: { fontSize: 14, fontWeight: '700', color: theme.colors.text },
  driverProfileBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: theme.colors.elevated,
    padding: 12,
    borderRadius: theme.borderRadius.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    marginBottom: 14,
  },
  driverAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: theme.colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  driverName: { fontSize: 14, fontWeight: '700', color: theme.colors.text },
  driverVehicle: { fontSize: 11, color: theme.colors.muted, marginTop: 1 },
  driverRating: { fontSize: 11, color: theme.colors.accent, fontWeight: '600', marginTop: 2 },
  fareTag: { alignItems: 'flex-end' },
  fareAmount: { fontSize: 16, fontWeight: '900', color: theme.colors.accent },
  searchingRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 12 },
  searchingText: { fontSize: 13, color: theme.colors.muted },
  btnAbort: {
    backgroundColor: theme.colors.dangerLight,
    borderColor: theme.colors.danger,
    borderWidth: 1,
    paddingVertical: 12,
    borderRadius: theme.borderRadius.md,
    alignItems: 'center',
  },
  btnAbortText: { color: theme.colors.danger, fontSize: 13, fontWeight: '700' },
  driverPin: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.accent,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    padding: 24,
  },
  modalCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.xl,
    padding: 24,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  modalTitle: { fontSize: 18, fontWeight: '800', color: theme.colors.text, textAlign: 'center' },
  modalSubtitle: { fontSize: 13, color: theme.colors.muted, textAlign: 'center', marginTop: 4, marginBottom: 16 },
  starRow: { flexDirection: 'row', justifyContent: 'center', gap: 12, marginBottom: 16 },
  starBtn: { padding: 4 },
  starIcon: { fontSize: 32, color: theme.colors.borderLight },
  starIconActive: { color: theme.colors.accent },
  commentInput: {
    backgroundColor: theme.colors.elevated,
    borderRadius: theme.borderRadius.md,
    padding: 12,
    color: theme.colors.text,
    fontSize: 13,
    minHeight: 64,
    textAlignVertical: 'top',
    borderWidth: 1,
    borderColor: theme.colors.border,
    marginBottom: 16,
  },
  btnSubmitRating: {
    backgroundColor: theme.colors.accent,
    paddingVertical: 14,
    borderRadius: theme.borderRadius.md,
    alignItems: 'center',
  },
  btnSubmitRatingText: { color: theme.colors.textDark, fontSize: 14, fontWeight: '700' },
});
