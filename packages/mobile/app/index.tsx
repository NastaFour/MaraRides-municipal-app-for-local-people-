import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { theme } from '../src/theme/theme';

export default function Index() {
  const router = useRouter();

  const handleNav = (path: any) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push(path);
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        {/* Top Logo & Hero */}
        <View style={styles.heroSection}>
          <View style={styles.badgeContainer}>
            <Text style={styles.badgeText}>MUNICIPIO MARA</Text>
          </View>

          <View style={styles.logoIcon}>
            <Text style={styles.logoEmoji}>🏍</Text>
          </View>

          <Text style={styles.brandTitle}>
            MARA<Text style={styles.brandAccent}>RIDES</Text>
          </Text>
          <Text style={styles.brandSubtitle}>
            Transporte municipal rápido, seguro y al precio oficial
          </Text>
        </View>

        {/* Feature Highlights */}
        <View style={styles.featuresSection}>
          <View style={styles.featureItem}>
            <Text style={styles.featureBullet}>✓</Text>
            <Text style={styles.featureText}>Conductores verificados por la municipalidad</Text>
          </View>
          <View style={styles.featureItem}>
            <Text style={styles.featureBullet}>✓</Text>
            <Text style={styles.featureText}>Rastreo satelital GPS en tiempo real</Text>
          </View>
          <View style={styles.featureItem}>
            <Text style={styles.featureBullet}>✓</Text>
            <Text style={styles.featureText}>Tarifa justa garantizada y pago móvil</Text>
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionsBox}>
          <TouchableOpacity
            style={styles.btnPrimary}
            activeOpacity={0.8}
            onPress={() => handleNav('/auth/login')}
          >
            <Text style={styles.btnPrimaryText}>Iniciar Sesión</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.btnSecondary}
            activeOpacity={0.8}
            onPress={() => handleNav('/auth/register')}
          >
            <Text style={styles.btnSecondaryText}>Crear Cuenta como Pasajero</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.btnDriverLink}
            activeOpacity={0.7}
            onPress={() => handleNav('/auth/register-driver')}
          >
            <Text style={styles.btnDriverLinkText}>
              ¿Eres mototaxista? <Text style={styles.underline}>Regístrate como Conductor</Text>
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.bg,
  },
  content: {
    flex: 1,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.xl,
    justifyContent: 'space-between',
  },
  heroSection: {
    alignItems: 'center',
    marginTop: theme.spacing.md,
  },
  badgeContainer: {
    backgroundColor: theme.colors.accentGlow,
    borderColor: theme.colors.accent,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: theme.borderRadius.full,
    marginBottom: theme.spacing.md,
  },
  badgeText: {
    color: theme.colors.accent,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.2,
  },
  logoIcon: {
    width: 72,
    height: 72,
    borderRadius: theme.borderRadius.xl,
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.border,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: theme.spacing.md,
    ...theme.shadows.card,
  },
  logoEmoji: {
    fontSize: 36,
  },
  brandTitle: {
    fontSize: 34,
    fontWeight: '900',
    color: theme.colors.text,
    letterSpacing: -0.5,
  },
  brandAccent: {
    color: theme.colors.accent,
  },
  brandSubtitle: {
    color: theme.colors.muted,
    fontSize: 14,
    textAlign: 'center',
    marginTop: theme.spacing.sm,
    maxWidth: 280,
    lineHeight: 20,
  },
  featuresSection: {
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.border,
    borderWidth: 1,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md,
    gap: 12,
    ...theme.shadows.card,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  featureBullet: {
    color: theme.colors.success,
    fontSize: 14,
    fontWeight: 'bold',
  },
  featureText: {
    color: theme.colors.textSecondary,
    fontSize: 13,
    fontWeight: '500',
  },
  actionsBox: {
    gap: theme.spacing.sm,
  },
  btnPrimary: {
    backgroundColor: theme.colors.accent,
    borderRadius: theme.borderRadius.md,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    ...theme.shadows.card,
  },
  btnPrimaryText: {
    color: theme.colors.textDark,
    fontWeight: '700',
    fontSize: 15,
  },
  btnSecondary: {
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.border,
    borderWidth: 1,
    borderRadius: theme.borderRadius.md,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnSecondaryText: {
    color: theme.colors.text,
    fontWeight: '600',
    fontSize: 14,
  },
  btnDriverLink: {
    paddingVertical: 8,
    alignItems: 'center',
  },
  btnDriverLinkText: {
    color: theme.colors.muted,
    fontSize: 12,
  },
  underline: {
    color: theme.colors.accent,
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
});
