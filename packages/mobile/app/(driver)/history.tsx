import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, FlatList,
  TouchableOpacity, ActivityIndicator, RefreshControl
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { theme } from '../../src/theme/theme';
import { request } from '../../src/services/api';

const STATUS_LABEL: Record<string, string> = {
  ACCEPTED: '✓ ACEPTADO',
  IN_PROGRESS: '🛵 EN CURSO',
  COMPLETED: '✅ COMPLETADO',
  CANCELLED: '✕ CANCELADO',
};

const STATUS_COLOR: Record<string, string> = {
  ACCEPTED: theme.colors.cyan,
  IN_PROGRESS: theme.colors.accent,
  COMPLETED: '#22c55e',
  CANCELLED: theme.colors.danger,
};

export default function DriverHistoryScreen() {
  const router = useRouter();
  const [trips, setTrips] = useState<any[]>([]);
  const [filter, setFilter] = useState<'all' | 'completed' | 'cancelled'>('all');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadTrips = async () => {
    try {
      const data = await request<any[]>('/trips');
      const history = Array.isArray(data)
        ? data.filter((t: any) => !['REQUESTED'].includes(t.status))
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

  const filtered = filter === 'all' ? trips
    : trips.filter((t) => t.status.toLowerCase() === filter.toUpperCase() || t.status === filter.toUpperCase());

  const completedCount = trips.filter(t => t.status === 'COMPLETED').length;
  const totalFare = trips
    .filter(t => t.status === 'COMPLETED' && t.fare != null)
    .reduce((acc, t) => acc + (t.fare ?? 0), 0);

  const formatDate = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleDateString('es-VE', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
  };

  const renderTrip = ({ item }: { item: any }) => (
    <View style={styles.tripCard}>
      <View style={styles.tripHeader}>
        <Text style={[styles.tripStatus, { color: STATUS_COLOR[item.status] ?? theme.colors.muted }]}>
          {STATUS_LABEL[item.status] ?? item.status}
        </Text>
        <Text style={styles.tripDate}>{formatDate(item.createdAt)}</Text>
      </View>

      <View style={styles.routeRow}>
        <Text style={styles.routeIcon}>📌</Text>
        <Text style={styles.routeText} numberOfLines={1}>{item.originAddress}</Text>
      </View>
      <View style={styles.routeRow}>
        <Text style={styles.routeIcon}>🏁</Text>
        <Text style={styles.routeText} numberOfLines={1}>{item.destAddress}</Text>
      </View>

      {item.client && (
        <Text style={styles.clientTag}>👤 {item.client.name} — {item.client.phone}</Text>
      )}
      {item.fare != null && item.status === 'COMPLETED' && (
        <Text style={styles.fareTag}>💰 ${item.fare.toFixed(2)} USD</Text>
      )}
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backTxt}>← VOLVER</Text>
        </TouchableOpacity>
        <Text style={styles.title}>HISTORIAL</Text>
        <View style={{ width: 60 }} />
      </View>

      {/* Estadísticas */}
      <View style={styles.statsRow}>
        <View style={styles.statBox}>
          <Text style={styles.statValue}>{completedCount}</Text>
          <Text style={styles.statLabel}>VIAJES</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={styles.statValue}>${totalFare.toFixed(2)}</Text>
          <Text style={styles.statLabel}>INGRESOS</Text>
        </View>
      </View>

      {/* Filtros */}
      <View style={styles.filterRow}>
        {(['all', 'completed', 'cancelled'] as const).map((f) => (
          <TouchableOpacity
            key={f}
            style={[styles.filterBtn, filter === f && styles.filterBtnActive]}
            onPress={() => setFilter(f)}
          >
            <Text style={[styles.filterTxt, filter === f && styles.filterTxtActive]}>
              {f === 'all' ? 'TODOS' : f === 'completed' ? 'COMPLETADOS' : 'CANCELADOS'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={theme.colors.accent} />
        </View>
      ) : filtered.length === 0 ? (
        <View style={styles.center}>
          <Text style={styles.emptyText}>// SIN REGISTROS</Text>
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.id}
          renderItem={renderTrip}
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.colors.accent} />}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.bg },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: theme.colors.border,
  },
  backBtn: { paddingVertical: 4 },
  backTxt: { color: theme.colors.cyan, fontFamily: theme.fonts.mono, fontSize: 12 },
  title: { color: theme.colors.accent, fontFamily: theme.fonts.mono, fontSize: 14, fontWeight: 'bold', letterSpacing: 2 },
  statsRow: { flexDirection: 'row', padding: 12, gap: 12, borderBottomWidth: 1, borderBottomColor: theme.colors.border },
  statBox: {
    flex: 1, backgroundColor: theme.colors.surface, padding: 12,
    alignItems: 'center', borderWidth: 1, borderColor: theme.colors.border,
  },
  statValue: { color: theme.colors.accent, fontFamily: theme.fonts.mono, fontSize: 22, fontWeight: 'bold' },
  statLabel: { color: theme.colors.muted, fontFamily: theme.fonts.mono, fontSize: 9, letterSpacing: 2, marginTop: 2 },
  filterRow: { flexDirection: 'row', padding: 12, gap: 8, borderBottomWidth: 1, borderBottomColor: theme.colors.border },
  filterBtn: { flex: 1, padding: 8, alignItems: 'center', borderWidth: 1, borderColor: theme.colors.border },
  filterBtnActive: { backgroundColor: theme.colors.accent, borderColor: theme.colors.accent },
  filterTxt: { color: theme.colors.muted, fontFamily: theme.fonts.mono, fontSize: 9, letterSpacing: 1 },
  filterTxtActive: { color: '#000', fontWeight: 'bold' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyText: { color: theme.colors.muted, fontFamily: theme.fonts.mono, fontSize: 13 },
  list: { padding: 12, gap: 10 },
  tripCard: {
    backgroundColor: theme.colors.surface, borderWidth: 1, borderColor: theme.colors.border,
    borderLeftWidth: 3, borderLeftColor: theme.colors.cyan, padding: 12, gap: 6,
  },
  tripHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  tripStatus: { fontFamily: theme.fonts.mono, fontSize: 12, fontWeight: 'bold' },
  tripDate: { color: theme.colors.muted, fontFamily: theme.fonts.mono, fontSize: 10 },
  routeRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  routeIcon: { fontSize: 11 },
  routeText: { color: theme.colors.text, fontFamily: theme.fonts.mono, fontSize: 11, flex: 1 },
  clientTag: { color: theme.colors.muted, fontFamily: theme.fonts.mono, fontSize: 11 },
  fareTag: { color: '#22c55e', fontFamily: theme.fonts.mono, fontSize: 12, fontWeight: 'bold' },
});
