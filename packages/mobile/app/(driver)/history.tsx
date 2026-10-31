import React, { useState, useEffect, useContext } from 'react';
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
import * as Haptics from 'expo-haptics';
import { theme } from '../../src/theme/theme';
import { AuthContext } from '../../src/context/AuthContext';
import { request } from '../../src/services/api';

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  ACCEPTED:    { label: 'Aceptado',   color: theme.colors.info,    bg: theme.colors.infoLight },
  IN_PROGRESS: { label: 'En Ruta',    color: theme.colors.info,    bg: theme.colors.infoLight },
  COMPLETED:   { label: 'Completado', color: theme.colors.success, bg: theme.colors.successLight },
  CANCELLED:   { label: 'Cancelado',  color: theme.colors.danger,  bg: theme.colors.dangerLight },
};

export default function DriverHistoryScreen() {
  const { user } = useContext(AuthContext);
  const router = useRouter();

  const [trips, setTrips] = useState<any[]>([]);
  const [filter, setFilter] = useState<'all' | 'completed' | 'cancelled'>('all');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadTrips = async () => {
    try {
      const data = await request<any[]>('/trips');
      const history = Array.isArray(data)
        ? data.filter((t: any) => t.status !== 'REQUESTED')
        : [];
      setTrips(history);
    } catch (_) {
      setTrips([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { loadTrips(); }, []);
  const onRefresh = () => { setRefreshing(true); loadTrips(); };

  const filtered = filter === 'all'
    ? trips
    : trips.filter((t) => t.status.toLowerCase() === filter.toLowerCase());

  const completedCount = trips.filter(t => t.status === 'COMPLETED').length;
  const totalEarnings = trips
    .filter(t => t.status === 'COMPLETED' && t.fare != null)
    .reduce((acc, t) => acc + (t.fare ?? 0), 0);

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
          {item.client && (
            <View>
              <Text style={styles.clientName}>👤 {item.client.name}</Text>
              <Text style={styles.clientPhone}>{item.client.phone}</Text>
            </View>
          )}

          {item.fare != null && item.status === 'COMPLETED' && (
            <View style={{ alignItems: 'flex-end' }}>
              <Text style={styles.fareAmount}>+${item.fare.toFixed(2)}</Text>
              <Text style={styles.fareLabel}>Tarifa cobrada</Text>
            </View>
          )}
        </View>

        {item.rating && (
          <View style={styles.ratingBox}>
            <Text style={styles.ratingScore}>
              Valoración del pasajero: {'⭐'.repeat(item.rating.score)} ({item.rating.score}/5)
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
      {/* Top Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backTxt}>← Volver</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Mis Ganancias & Carreras</Text>
        <View style={{ width: 60 }} />
      </View>

      {/* Driver Summary Metrics */}
      <View style={styles.summaryBar}>
        <View style={styles.metricCard}>
          <Text style={styles.metricLabel}>TOTAL GENERADO</Text>
          <Text style={styles.metricValue}>${totalEarnings.toFixed(2)}</Text>
        </View>
        <View style={styles.metricCard}>
          <Text style={styles.metricLabel}>COMPLETADOS</Text>
          <Text style={styles.metricValue}>{completedCount}</Text>
        </View>
        <View style={styles.metricCard}>
          <Text style={styles.metricLabel}>VALORACIÓN</Text>
          <Text style={[styles.metricValue, { color: theme.colors.accent }]}>
            ⭐ {((user as any)?.ratingAvg ?? 5.0).toFixed(1)}
          </Text>
        </View>
      </View>

      {/* Filter Tabs */}
      <View style={styles.filterRow}>
        {(['all', 'completed', 'cancelled'] as const).map((f) => (
          <TouchableOpacity
            key={f}
            style={[styles.filterBtn, filter === f && styles.filterBtnActive]}
            onPress={() => {
              Haptics.selectionAsync();
              setFilter(f);
            }}
          >
            <Text style={[styles.filterTxt, filter === f && styles.filterTxtActive]}>
              {f === 'all' ? 'Todos' : f === 'completed' ? 'Completados' : 'Cancelados'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={theme.colors.accent} />
          <Text style={styles.loadingTxt}>Cargando resumen de viajes...</Text>
        </View>
      ) : filtered.length === 0 ? (
        <View style={styles.center}>
          <Text style={{ fontSize: 36, marginBottom: 12 }}>🏍</Text>
          <Text style={styles.emptyTitle}>Sin carreras en esta sección</Text>
          <Text style={styles.emptySubtext}>Ponte en línea en la pantalla principal para recibir viajes</Text>
        </View>
      ) : (
        <FlatList
          data={filtered}
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
  summaryBar: {
    flexDirection: 'row',
    padding: 16,
    gap: 10,
    backgroundColor: theme.colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  metricCard: {
    flex: 1,
    backgroundColor: theme.colors.elevated,
    borderRadius: theme.borderRadius.md,
    padding: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  metricLabel: { color: theme.colors.muted, fontSize: 9, fontWeight: '700', letterSpacing: 0.5 },
  metricValue: { color: theme.colors.text, fontSize: 18, fontWeight: '900', marginTop: 4 },
  filterRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
  },
  filterBtn: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: theme.borderRadius.sm,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  filterBtnActive: {
    backgroundColor: theme.colors.accent,
    borderColor: theme.colors.accent,
  },
  filterTxt: { color: theme.colors.muted, fontSize: 12, fontWeight: '600' },
  filterTxtActive: { color: theme.colors.textDark, fontWeight: '700' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  loadingTxt: { color: theme.colors.muted, fontSize: 12, marginTop: 10 },
  emptyTitle: { color: theme.colors.text, fontSize: 16, fontWeight: '700' },
  emptySubtext: { color: theme.colors.muted, fontSize: 13, textAlign: 'center', marginTop: 4 },
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
  clientName: { color: theme.colors.textSecondary, fontSize: 13, fontWeight: '600' },
  clientPhone: { color: theme.colors.muted, fontSize: 11, marginTop: 1 },
  fareAmount: { color: theme.colors.success, fontSize: 16, fontWeight: '900' },
  fareLabel: { color: theme.colors.muted, fontSize: 10 },
  ratingBox: {
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },
  ratingScore: { color: theme.colors.accent, fontSize: 11, fontWeight: '700' },
  ratingComment: { color: theme.colors.muted, fontSize: 11, fontStyle: 'italic', marginTop: 2 },
});
