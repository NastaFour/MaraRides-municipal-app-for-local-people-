import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { theme } from '../../src/theme/theme';
import { request } from '../../src/services/api';

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  REQUESTED:   { label: 'Buscando',   color: theme.colors.warn,    bg: theme.colors.accentGlow },
  ACCEPTED:    { label: 'En Camino',  color: theme.colors.info,    bg: theme.colors.infoLight },
  IN_PROGRESS: { label: 'En Ruta',    color: theme.colors.info,    bg: theme.colors.infoLight },
  COMPLETED:   { label: 'Completado', color: theme.colors.success, bg: theme.colors.successLight },
  CANCELLED:   { label: 'Cancelado',  color: theme.colors.danger,  bg: theme.colors.dangerLight },
};

export default function ClientHistoryScreen() {
  const router = useRouter();
  const [trips, setTrips] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadTrips = async () => {
    try {
      const data = await request<any[]>('/trips');
      setTrips(Array.isArray(data) ? data : []);
    } catch (_) {
      setTrips([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { loadTrips(); }, []);

  const onRefresh = () => { setRefreshing(true); loadTrips(); };

  const formatDate = (iso: string) => {
    try {
      const d = new Date(iso);
      return d.toLocaleDateString('es-VE', {
        day: '2-digit', month: 'short',
        hour: '2-digit', minute: '2-digit',
      });
    } catch {
      return iso;
    }
  };

  const renderTrip = ({ item }: { item: any }) => {
    const config = STATUS_CONFIG[item.status] || {
      label: item.status,
      color: theme.colors.muted,
      bg: theme.colors.elevated,
    };

    return (
      <View style={styles.tripCard}>
        <View style={styles.tripHeader}>
          <View style={[styles.statusBadge, { backgroundColor: config.bg }]}>
            <Text style={[styles.statusBadgeText, { color: config.color }]}>
              {config.label}
            </Text>
          </View>
          <Text style={styles.tripDate}>{formatDate(item.createdAt)}</Text>
        </View>

        <View style={styles.tripRoute}>
          <View style={styles.routeRow}>
            <Text style={styles.routeDot}>🟢</Text>
            <Text style={styles.routeText} numberOfLines={1}>{item.originAddress}</Text>
          </View>
          <View style={styles.routeLine} />
          <View style={styles.routeRow}>
            <Text style={styles.routeDot}>🏁</Text>
            <Text style={styles.routeText} numberOfLines={1}>{item.destAddress}</Text>
          </View>
        </View>

        <View style={styles.tripFooter}>
          {item.driver ? (
            <View style={styles.driverInfo}>
              <Text style={styles.driverName}>🏍 {item.driver.name}</Text>
              {item.driver.vehicle && (
                <Text style={styles.driverPlate}>{item.driver.vehicle.plate}</Text>
              )}
            </View>
          ) : (
            <Text style={styles.driverUnassigned}>Sin asignar</Text>
          )}

          {item.fare != null && (
            <Text style={styles.fareAmount}>${item.fare.toFixed(2)}</Text>
          )}
        </View>

        {item.rating && (
          <View style={styles.ratingBox}>
            <Text style={styles.ratingText}>
              Tu calificación: {'⭐'.repeat(item.rating.score)} ({item.rating.score}/5)
            </Text>
            {item.rating.comment ? (
              <Text style={styles.ratingComment}>"{item.rating.comment}"</Text>
            ) : null}
          </View>
        )}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backTxt}>← Volver</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Mis Viajes</Text>
        <View style={{ width: 60 }} />
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={theme.colors.accent} />
          <Text style={styles.loadingTxt}>Cargando historial...</Text>
        </View>
      ) : trips.length === 0 ? (
        <View style={styles.center}>
          <Text style={{ fontSize: 40, marginBottom: 12 }}>🛵</Text>
          <Text style={styles.emptyTitle}>Aún no has realizado viajes</Text>
          <Text style={styles.emptySubtext}>Tus carreras solicitadas aparecerán aquí</Text>
        </View>
      ) : (
        <FlatList
          data={trips}
          keyExtractor={(item) => item.id}
          renderItem={renderTrip}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={theme.colors.accent}
            />
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.bg },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
    backgroundColor: theme.colors.surface,
  },
  backBtn: { paddingVertical: 4 },
  backTxt: { color: theme.colors.muted, fontSize: 13, fontWeight: '600' },
  title: { color: theme.colors.text, fontSize: 16, fontWeight: '800' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  loadingTxt: { color: theme.colors.muted, fontSize: 12, marginTop: 10 },
  emptyTitle: { color: theme.colors.text, fontSize: 16, fontWeight: '700' },
  emptySubtext: { color: theme.colors.muted, fontSize: 13, marginTop: 4 },
  list: { padding: 16, gap: 12 },
  tripCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.lg,
    padding: 16,
    borderWidth: 1,
    borderColor: theme.colors.border,
    ...theme.shadows.card,
  },
  tripHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: theme.borderRadius.full },
  statusBadgeText: { fontSize: 11, fontWeight: '700' },
  tripDate: { color: theme.colors.muted, fontSize: 11 },
  tripRoute: { gap: 6, marginBottom: 12 },
  routeRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  routeDot: { fontSize: 10 },
  routeText: { color: theme.colors.text, fontSize: 13, fontWeight: '500', flex: 1 },
  routeLine: { width: 1, height: 10, backgroundColor: theme.colors.borderLight, marginLeft: 5 },
  tripFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
    paddingTop: 10,
  },
  driverInfo: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  driverName: { color: theme.colors.textSecondary, fontSize: 12, fontWeight: '600' },
  driverPlate: {
    backgroundColor: theme.colors.elevated,
    color: theme.colors.accent,
    fontSize: 10,
    fontWeight: '800',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  driverUnassigned: { color: theme.colors.muted, fontSize: 12, fontStyle: 'italic' },
  fareAmount: { color: theme.colors.accent, fontSize: 16, fontWeight: '900' },
  ratingBox: {
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },
  ratingText: { color: theme.colors.accent, fontSize: 11, fontWeight: '700' },
  ratingComment: { color: theme.colors.muted, fontSize: 11, fontStyle: 'italic', marginTop: 2 },
});
