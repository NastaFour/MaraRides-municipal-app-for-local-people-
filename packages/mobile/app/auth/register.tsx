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

export default function RegisterClientScreen() {
  const [form, setForm] = useState({
    name: '',
    phone: '',
    password: '',
  });
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleRegister = async () => {
    if (!form.name.trim() || !form.phone.trim() || !form.password.trim()) {
      Alert.alert('Campos incompletos', 'Por favor llena todos los campos para registrarte.');
      return;
    }

    setLoading(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    try {
      await request('/auth/client/register', {
        method: 'POST',
        body: JSON.stringify({
          name: form.name.trim(),
          phone: form.phone.trim(),
          password: form.password,
        }),
        skipAuth: true,
      });

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert(
        '¡Registro Exitoso!',
        'Tu cuenta de pasajero ha sido creada. Ya puedes iniciar sesión y solicitar carreras.',
        [{ text: 'Iniciar Sesión', onPress: () => router.replace('/auth/login') }]
      );
    } catch (e: any) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert('Error en registro', e.message || 'No se pudo crear la cuenta.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Top Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Text style={styles.backTxt}>← Volver</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Crear Cuenta de Pasajero</Text>
          <Text style={styles.headerSubtitle}>
            Muévete por el municipio Mara de forma rápida, segura y económica
          </Text>
        </View>

        {/* Card Form */}
        <View style={styles.formCard}>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Nombre y Apellido</Text>
            <TextInput
              style={styles.input}
              placeholder="Ej. Juan Pérez"
              placeholderTextColor={theme.colors.muted}
              value={form.name}
              onChangeText={(v) => setForm({ ...form, name: v })}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Número de Teléfono</Text>
            <TextInput
              style={styles.input}
              placeholder="04141234567"
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

          <TouchableOpacity
            style={styles.submitBtn}
            onPress={handleRegister}
            disabled={loading}
            activeOpacity={0.8}
          >
            {loading ? (
              <ActivityIndicator color={theme.colors.textDark} size="small" />
            ) : (
              <Text style={styles.submitBtnText}>Registrarme como Pasajero</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => router.replace('/auth/login')}
            style={styles.loginLink}
          >
            <Text style={styles.loginLinkText}>
              ¿Ya tienes cuenta? <Text style={styles.highlight}>Inicia Sesión</Text>
            </Text>
          </TouchableOpacity>
        </View>
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
    flexGrow: 1,
    justifyContent: 'center',
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
  formCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.xl,
    padding: theme.spacing.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    ...theme.shadows.card,
    gap: theme.spacing.md,
  },
  inputGroup: {
    gap: 6,
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
    marginTop: theme.spacing.sm,
    ...theme.shadows.card,
  },
  submitBtnText: {
    color: theme.colors.textDark,
    fontWeight: '700',
    fontSize: 15,
  },
  loginLink: {
    alignItems: 'center',
    paddingVertical: 6,
    marginTop: 4,
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
