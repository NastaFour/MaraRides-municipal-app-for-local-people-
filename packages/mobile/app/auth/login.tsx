import React, { useState, useContext } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { request, setToken } from '../../src/services/api';
import { setUser } from '../../src/utils/storage';
import { AuthContext } from '../../src/context/AuthContext';
import { theme } from '../../src/theme/theme';

export default function LoginScreen() {
  const [roleMode, setRoleMode] = useState<'CLIENT' | 'DRIVER'>('CLIENT');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMSG, setErrorMSG] = useState<string | null>(null);

  const { loginSession } = useContext(AuthContext);
  const router = useRouter();

  const handleLogin = async () => {
    if (!phone.trim() || !password.trim()) {
      setErrorMSG('Ingresa tu teléfono y contraseña');
      return;
    }

    setLoading(true);
    setErrorMSG(null);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    try {
      const endpoint = roleMode === 'CLIENT' ? '/auth/client/login' : '/auth/driver/login';
      const res = await request<any>(endpoint, {
        method: 'POST',
        body: JSON.stringify({ phone: phone.trim(), password }),
        skipAuth: true,
      });

      const userPayload = roleMode === 'CLIENT'
        ? res.user
        : { ...res.driver, role: 'DRIVER' };

      await setToken(res.token);
      await setUser(userPayload);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      loginSession(userPayload);
    } catch (e: any) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      setErrorMSG(e.message || 'Credenciales incorrectas');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.scrollContent}>
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
              <Text style={styles.backBtnText}>← Volver</Text>
            </TouchableOpacity>

            <View style={styles.brandIconBox}>
              <Text style={{ fontSize: 28 }}>🏍</Text>
            </View>
            <h1 style={styles.title as any}>Bienvenido de vuelta</h1>
            <Text style={styles.subtitle}>Inicia sesión en Mara Rides</Text>
          </View>

          {/* Role Segmented Selector */}
          <View style={styles.roleSelector}>
            <TouchableOpacity
              style={[styles.roleTab, roleMode === 'CLIENT' && styles.roleTabActive]}
              onPress={() => {
                Haptics.selectionAsync();
                setRoleMode('CLIENT');
                setErrorMSG(null);
              }}
            >
              <Text style={[styles.roleTabText, roleMode === 'CLIENT' && styles.roleTabTextActive]}>
                Pasajero
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.roleTab, roleMode === 'DRIVER' && styles.roleTabActive]}
              onPress={() => {
                Haptics.selectionAsync();
                setRoleMode('DRIVER');
                setErrorMSG(null);
              }}
            >
              <Text style={[styles.roleTabText, roleMode === 'DRIVER' && styles.roleTabTextActive]}>
                Conductor
              </Text>
            </TouchableOpacity>
          </View>

          {/* Form Card */}
          <View style={styles.card}>
            {errorMSG && (
              <View style={styles.errorBox}>
                <Text style={styles.errorText}>⚠ {errorMSG}</Text>
              </View>
            )}

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Número de Teléfono</Text>
              <TextInput
                style={styles.input}
                placeholder="04141234567"
                placeholderTextColor={theme.colors.muted}
                keyboardType="phone-pad"
                value={phone}
                onChangeText={setPhone}
                autoCapitalize="none"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Contraseña</Text>
              <TextInput
                style={styles.input}
                placeholder="••••••••"
                placeholderTextColor={theme.colors.muted}
                secureTextEntry
                value={password}
                onChangeText={setPassword}
              />
            </View>

            <TouchableOpacity
              style={styles.btnPrimary}
              onPress={handleLogin}
              disabled={loading}
              activeOpacity={0.8}
            >
              {loading ? (
                <ActivityIndicator color={theme.colors.textDark} size="small" />
              ) : (
                <Text style={styles.btnPrimaryText}>
                  Entrar como {roleMode === 'CLIENT' ? 'Pasajero' : 'Conductor'}
                </Text>
              )}
            </TouchableOpacity>
          </View>

          {/* Footer links */}
          <View style={styles.footer}>
            {roleMode === 'CLIENT' ? (
              <TouchableOpacity onPress={() => router.push('/auth/register')}>
                <Text style={styles.footerLink}>
                  ¿No tienes cuenta? <Text style={styles.highlight}>Regístrate gratis</Text>
                </Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity onPress={() => router.push('/auth/register-driver')}>
                <Text style={styles.footerLink}>
                  ¿Quieres conducir? <Text style={styles.highlight}>Postula tu mototaxi</Text>
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
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
    alignItems: 'center',
    marginBottom: theme.spacing.lg,
  },
  backBtn: {
    alignSelf: 'flex-start',
    marginBottom: theme.spacing.sm,
    paddingVertical: 4,
  },
  backBtnText: {
    color: theme.colors.muted,
    fontSize: 13,
    fontWeight: '500',
  },
  brandIconBox: {
    width: 56,
    height: 56,
    borderRadius: theme.borderRadius.lg,
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.border,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: theme.spacing.sm,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: theme.colors.text,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 13,
    color: theme.colors.muted,
    marginTop: 4,
    textAlign: 'center',
  },
  roleSelector: {
    flexDirection: 'row',
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.md,
    padding: 4,
    marginBottom: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  roleTab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: theme.borderRadius.sm,
  },
  roleTabActive: {
    backgroundColor: theme.colors.accent,
  },
  roleTabText: {
    fontSize: 13,
    fontWeight: '600',
    color: theme.colors.muted,
  },
  roleTabTextActive: {
    color: theme.colors.textDark,
  },
  card: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.xl,
    padding: theme.spacing.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    ...theme.shadows.card,
  },
  inputGroup: {
    marginBottom: theme.spacing.md,
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    color: theme.colors.textSecondary,
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  input: {
    backgroundColor: theme.colors.elevated,
    borderRadius: theme.borderRadius.md,
    borderColor: theme.colors.border,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: theme.colors.text,
  },
  btnPrimary: {
    backgroundColor: theme.colors.accent,
    borderRadius: theme.borderRadius.md,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: theme.spacing.sm,
    ...theme.shadows.card,
  },
  btnPrimaryText: {
    color: theme.colors.textDark,
    fontSize: 15,
    fontWeight: '700',
  },
  errorBox: {
    backgroundColor: theme.colors.dangerLight,
    borderColor: theme.colors.danger,
    borderWidth: 1,
    borderRadius: theme.borderRadius.sm,
    padding: 10,
    marginBottom: theme.spacing.md,
  },
  errorText: {
    color: theme.colors.danger,
    fontSize: 12,
  },
  footer: {
    marginTop: theme.spacing.lg,
    alignItems: 'center',
  },
  footerLink: {
    color: theme.colors.muted,
    fontSize: 13,
  },
  highlight: {
    color: theme.colors.accent,
    fontWeight: '700',
  },
});
