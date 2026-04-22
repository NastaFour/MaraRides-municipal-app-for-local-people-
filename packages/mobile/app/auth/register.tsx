import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
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
    if (!form.name || !form.phone || !form.password) {
      Alert.alert('REGISTRO FALLIDO', 'Todos los campos son obligatorios.');
      return;
    }

    setLoading(true);
    try {
      await request('/auth/client/register', {
        method: 'POST',
        body: JSON.stringify(form),
        skipAuth: true
      });
      
      Alert.alert(
        'SISTEMA ACTUALIZADO', 
        'Registro exitoso. Procede a iniciar sesión.',
        [{ text: 'ENTENDIDO', onPress: () => router.replace('/auth/login') }]
      );
    } catch (e: any) {
      Alert.alert('ERROR CRÍTICO', e.message || 'No se pudo completar el registro.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
      {/* Technical Header */}
      <View style={styles.header}>
        <Text style={styles.headerLabel}>// IDENTIFICACIÓN DE SUJETO</Text>
        <Text style={styles.headerTitle}>REGISTRO DE <Text style={styles.accent}>CLIENTE</Text></Text>
        <View style={styles.sysRef}>
          <Text style={styles.sysText}>REF: CT-USR-NEW</Text>
          <View style={styles.dot} />
        </View>
      </View>

      {/* Hazard Stripes */}
      <View style={styles.hazardContainer}>
        <LinearGradient
          colors={[theme.colors.accent, '#000', theme.colors.accent, '#000']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          locations={[0, 0.45, 0.5, 0.95]}
          style={styles.hazardStrip}
        />
      </View>

      <View style={styles.formPanel}>
        <View style={styles.inputBox}>
          <Text style={styles.label}>[ NOMBRE COMPLETO ]</Text>
          <TextInput
            style={styles.input}
            placeholder="EJ. JUAN PÉREZ"
            placeholderTextColor={theme.colors.muted}
            value={form.name}
            onChangeText={(v) => setForm({ ...form, name: v })}
          />
        </View>

        <View style={styles.inputBox}>
          <Text style={styles.label}>[ TERMINAL MÓVIL ]</Text>
          <TextInput
            style={styles.input}
            placeholder="04140000000"
            placeholderTextColor={theme.colors.muted}
            keyboardType="phone-pad"
            value={form.phone}
            onChangeText={(v) => setForm({ ...form, phone: v })}
          />
        </View>

        <View style={styles.inputBox}>
          <Text style={styles.label}>[ LLAVE DE ACCESO ]</Text>
          <TextInput
            style={styles.input}
            placeholder="••••••••"
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
          activeOpacity={0.9}
        >
          {loading ? (
            <ActivityIndicator color="#000" size="small" />
          ) : (
            <Text style={styles.submitBtnText}>EJECUTAR ALTA DE USUARIO</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity 
          onPress={() => router.back()} 
          style={styles.backBtn}
        >
          <Text style={styles.backBtnText}>&lt; ABORTAR Y REGRESAR</Text>
        </TouchableOpacity>
      </View>

      {/* Visual background elements */}
      <View style={styles.footerInfo}>
        <Text style={styles.footerText}>MEM_STATUS: 0x8922</Text>
        <Text style={styles.footerText}>ENCRYPTION: AES-256-ACTIVE</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.bg,
  },
  scrollContent: {
    padding: theme.spacing.lg,
    paddingTop: 60,
  },
  header: {
    marginBottom: theme.spacing.xl,
  },
  headerLabel: {
    color: theme.colors.muted,
    fontFamily: theme.fonts.mono,
    fontSize: 10,
    letterSpacing: 2,
  },
  headerTitle: {
    color: theme.colors.text,
    fontSize: 32,
    fontWeight: '900',
    marginTop: theme.spacing.xs,
  },
  accent: {
    color: theme.colors.accent,
  },
  sysRef: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: theme.spacing.sm,
  },
  sysText: {
    color: theme.colors.cyan,
    fontFamily: theme.fonts.mono,
    fontSize: 12,
  },
  dot: {
    width: 6,
    height: 6,
    backgroundColor: theme.colors.cyan,
  },
  hazardContainer: {
    height: 4,
    backgroundColor: '#000',
    marginVertical: theme.spacing.lg,
    overflow: 'hidden',
  },
  hazardStrip: {
    flex: 1,
    transform: [{ scaleX: 2 }],
  },
  formPanel: {
    gap: theme.spacing.xl,
  },
  inputBox: {
    gap: theme.spacing.xs,
  },
  label: {
    color: theme.colors.muted,
    fontFamily: theme.fonts.mono,
    fontSize: 12,
  },
  input: {
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
    padding: theme.spacing.md,
    color: theme.colors.text,
    fontFamily: theme.fonts.mono,
    fontSize: 16,
  },
  submitBtn: {
    backgroundColor: theme.colors.accent,
    padding: theme.spacing.lg,
    alignItems: 'center',
    marginTop: theme.spacing.md,
    borderWidth: 1,
    borderColor: '#000',
  },
  submitBtnText: {
    color: '#000',
    fontWeight: 'bold',
    fontFamily: theme.fonts.mono,
    letterSpacing: 1,
  },
  backBtn: {
    padding: theme.spacing.md,
    alignItems: 'center',
  },
  backBtnText: {
    color: theme.colors.danger,
    fontFamily: theme.fonts.mono,
    fontSize: 12,
    textDecorationLine: 'underline',
  },
  footerInfo: {
    marginTop: 60,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
    paddingTop: theme.spacing.md,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  footerText: {
    color: '#222',
    fontSize: 10,
    fontFamily: theme.fonts.mono,
  },
});
