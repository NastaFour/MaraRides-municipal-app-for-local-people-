import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { request } from '../../src/services/api';
import { theme } from '../../src/theme/theme';

export default function RegisterDriverScreen() {
  const [form, setForm] = useState({
    name: '',
    phone: '',
    password: '',
    licenseNum: '',
    vehicle: {
      plate: '',
      model: '',
      year: '',
    },
  });
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleRegister = async () => {
    const { name, phone, password, licenseNum, vehicle } = form;
    if (!name.trim() || !phone.trim() || !password.trim() || !licenseNum.trim() || !vehicle.plate.trim() || !vehicle.model.trim()) {
      Alert.alert('Datos Incompletos', 'Por favor llena todos los datos del conductor y de la mototaxi.');
      return;
    }

    setLoading(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    try {
      await request('/auth/driver/register', {
        method: 'POST',
        body: JSON.stringify({
          name: name.trim(),
          phone: phone.trim(),
          password,
          licenseNum: licenseNum.trim(),
          vehicle: {
            plate: vehicle.plate.trim().toUpperCase(),
            model: vehicle.model.trim(),
            year: Number(vehicle.year) || 2024,
          },
        }),
        skipAuth: true,
      });

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert(
        '¡Solicitud Registrada!',
        'Tu expediente fue recibido. La Dirección de Transporte Municipal revisará tu documentación para aprobarte.',
        [{ text: 'Entendido', onPress: () => router.replace('/auth/login') }]
      );
    } catch (e: any) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert('Error en postulación', e.message || 'No se pudo completar el registro del conductor.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Text style={styles.backTxt}>← Volver</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Postulación de Mototaxista</Text>
          <Text style={styles.headerSubtitle}>
            Únete a la red oficial de mototaxis del Municipio Mara
          </Text>
        </View>

        {/* Personal Details Card */}
        <View style={styles.card}>
          <Text style={styles.cardSectionTitle}>Datos del Conductor</Text>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Nombre y Apellido</Text>
            <TextInput
              style={styles.input}
              placeholder="Ej. Carlos Mendoza"
              placeholderTextColor={theme.colors.muted}
              value={form.name}
              onChangeText={(v) => setForm({ ...form, name: v })}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Nro. de Licencia de Conducir</Text>
            <TextInput
              style={styles.input}
              placeholder="Ej. LIC-12345678"
              placeholderTextColor={theme.colors.muted}
              value={form.licenseNum}
              onChangeText={(v) => setForm({ ...form, licenseNum: v })}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Teléfono de Contacto</Text>
            <TextInput
              style={styles.input}
              placeholder="04161234567"
              placeholderTextColor={theme.colors.muted}
              keyboardType="phone-pad"
              value={form.phone}
              onChangeText={(v) => setForm({ ...form, phone: v })}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Contraseña</Text>
            <TextInput
              style={styles.input}
              placeholder="Crea una contraseña segura"
              placeholderTextColor={theme.colors.muted}
              secureTextEntry
              value={form.password}
              onChangeText={(v) => setForm({ ...form, password: v })}
            />
          </View>
        </View>

        {/* Vehicle Details Card */}
        <View style={[styles.card, { marginTop: 16 }]}>
          <Text style={styles.cardSectionTitle}>Datos de la Mototaxi</Text>

          <View style={styles.row}>
            <View style={[styles.inputGroup, { flex: 1 }]}>
              <Text style={styles.label}>Placa</Text>
              <TextInput
                style={styles.input}
                placeholder="AB1C23D"
                autoCapitalize="characters"
                placeholderTextColor={theme.colors.muted}
                value={form.vehicle.plate}
                onChangeText={(v) => setForm({ ...form, vehicle: { ...form.vehicle, plate: v } })}
              />
            </View>
            <View style={[styles.inputGroup, { width: 100 }]}>
              <Text style={styles.label}>Año</Text>
              <TextInput
                style={styles.input}
                placeholder="2024"
                keyboardType="numeric"
                placeholderTextColor={theme.colors.muted}
                value={form.vehicle.year}
                onChangeText={(v) => setForm({ ...form, vehicle: { ...form.vehicle, year: v } })}
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Marca y Modelo</Text>
            <TextInput
              style={styles.input}
              placeholder="Ej. Bera SBR / Empire Keeway"
              placeholderTextColor={theme.colors.muted}
              value={form.vehicle.model}
              onChangeText={(v) => setForm({ ...form, vehicle: { ...form.vehicle, model: v } })}
            />
          </View>
        </View>

        {/* Submit */}
        <TouchableOpacity
          style={styles.submitBtn}
          onPress={handleRegister}
          disabled={loading}
          activeOpacity={0.8}
        >
          {loading ? (
            <ActivityIndicator color={theme.colors.textDark} size="small" />
          ) : (
            <Text style={styles.submitBtnText}>Enviar Expediente para Aprobación</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity onPress={() => router.replace('/auth/login')} style={styles.loginLink}>
          <Text style={styles.loginLinkText}>
            ¿Ya tienes credenciales? <Text style={styles.highlight}>Inicia Sesión</Text>
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.bg,
  },
  scrollContent: {
    padding: theme.spacing.lg,
    paddingBottom: 40,
  },
  header: {
    marginBottom: theme.spacing.lg,
  },
  backBtn: {
    alignSelf: 'flex-start',
    paddingVertical: 4,
    marginBottom: theme.spacing.sm,
  },
  backTxt: {
    color: theme.colors.muted,
    fontSize: 13,
    fontWeight: '600',
  },
  headerTitle: {
    color: theme.colors.text,
    fontSize: 22,
    fontWeight: '800',
  },
  headerSubtitle: {
    color: theme.colors.muted,
    fontSize: 13,
    marginTop: 4,
    lineHeight: 18,
  },
  card: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.xl,
    padding: theme.spacing.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    ...theme.shadows.card,
    gap: theme.spacing.md,
  },
  cardSectionTitle: {
    color: theme.colors.accent,
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  inputGroup: {
    gap: 6,
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  label: {
    color: theme.colors.textSecondary,
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  input: {
    backgroundColor: theme.colors.elevated,
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: theme.colors.text,
    fontSize: 15,
  },
  submitBtn: {
    backgroundColor: theme.colors.accent,
    borderRadius: theme.borderRadius.md,
    paddingVertical: 15,
    alignItems: 'center',
    marginTop: 20,
    ...theme.shadows.card,
  },
  submitBtnText: {
    color: theme.colors.textDark,
    fontWeight: '700',
    fontSize: 15,
  },
  loginLink: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  loginLinkText: {
    color: theme.colors.muted,
    fontSize: 13,
  },
  highlight: {
    color: theme.colors.accent,
    fontWeight: '700',
  },
});
