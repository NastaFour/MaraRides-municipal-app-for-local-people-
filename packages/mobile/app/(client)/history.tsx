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
  REQUESTED: '⟳ SOLICITADO',
  ACCEPTED: '✓ ACEPTADO',
  IN_PROGRESS: '🛵 EN CURSO',
  COMPLETED: '✅ COMPLETADO',
  CANCELLED: '✕ CANCELADO',
};

const STATUS_COLOR: Record<string, string> = {
  REQUESTED: theme.colors.muted,
  ACCEPTED: theme.colors.cyan,
  IN_PROGRESS: theme.colors.accent,
  COMPLETED: '#22c55e',
  CANCELLED: theme.colors.danger,
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
    const d = new Date(iso);
    return d.toLocaleDateString('es-VE', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  const renderTrip = ({ item }: { item: any }) => (
    <View style={styles.tripCard}>
      <View style={styles.tripHeader}>
        <Text style={[styles.tripStatus, { color: STATUS_COLOR[item.status] ?? theme.colors.muted }]}>
          {STATUS_LABEL[item.status] ?? item.status}
        </Text>
        <Text style={styles.tripDate}>{formatDate(item.createdAt)}</Text>
      </View>

      <View style={styles.tripRoute}>
        <View style={styles.routeRow}>
          <Text style={styles.routeIcon}>📌</Text>
          <Text style={styles.routeText} numberOfLines={1}>{item.originAddress}</Text>
        </View>
        <View style={styles.routeDivider} />
        <View style={styles.routeRow}>
          <Text style={styles.routeIcon}>🏁</Text>
          <Text style={styles.routeText} numberOfLines={1}>{item.destAddress}</Text>
        </View>
      </View>

      {item.driver && (
        <Text style={styles.driverTag}>🛵 {item.driver.name}</Text>
      )}

      {item.fare != null && (
        <Text style={styles.fareTag}>Tarifa: ${item.fare.toFixed(2)} USD</Text>
      )}
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backTxt}>← VOLVER</Text>
        </TouchableOpacity>
        <Text style={styles.title}>MIS VIAJES</Text>
        <View style={{ width: 60 }} />
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={theme.colors.accent} />
        </View>
      ) : trips.length === 0 ? (
        <View style={styles.center}>
          <Text style={styles.emptyText}>// SIN VIAJES REGISTRADOS</Text>
          <Text style={styles.emptySubtext}>Tu historial aparecerá aquí</Text>
        </View>
      ) : (
        <FlatList
          data={trips}
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  backBtn: { paddingVertical: 4, paddingHorizontal: 4 },
  backTxt: { color: theme.colors.cyan, fontFamily: theme.fonts.mono, fontSize: 12 },
  title: { color: theme.colors.accent, fontFamily: theme.fonts.mono, fontSize: 14, fontWeight: 'bold', letterSpacing: 2 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 8 },
  emptyText: { color: theme.colors.muted, fontFamily: theme.fonts.mono, fontSize: 13 },
  emptySubtext: { color: '#333', fontFamily: theme.fonts.mono, fontSize: 11 },
  list: { padding: 16, gap: 12 },
  tripCard: {
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderLeftWidth: 3,
    borderLeftColor: theme.colors.accent,
    padding: 14,
    gap: 8,
  },
  tripHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  tripStatus: { fontFamily: theme.fonts.mono, fontSize: 12, fontWeight: 'bold' },
  tripDate: { color: theme.colors.muted, fontFamily: theme.fonts.mono, fontSize: 10 },
  tripRoute: { gap: 4 },
  routeRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  routeIcon: { fontSize: 12 },
  routeText: { color: theme.colors.text, fontFamily: theme.fonts.mono, fontSize: 12, flex: 1 },
  routeDivider: { height: 1, backgroundColor: theme.colors.border, marginLeft: 20 },
  driverTag: { color: theme.colors.cyan, fontFamily: theme.fonts.mono, fontSize: 11 },
  fareTag: { color: theme.colors.accent, fontFamily: theme.fonts.mono, fontSize: 11, fontWeight: 'bold' },
});
