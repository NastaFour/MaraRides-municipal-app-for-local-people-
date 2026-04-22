import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, ActivityIndicator, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
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
    }
  });
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleRegister = async () => {
    const { name, phone, password, licenseNum, vehicle } = form;
    if (!name || !phone || !password || !licenseNum || !vehicle.plate || !vehicle.model) {
      Alert.alert('REGISTRO RECHAZADO', 'Faltan datos obligatorios para el expediente del conductor.');
      return;
    }

    setLoading(true);
    try {
      await request('/auth/driver/register', {
        method: 'POST',
        body: JSON.stringify(form),
        skipAuth: true
      });
      
      Alert.alert(
        'EXPEDIENTE CREADO', 
        'Registro exitoso. Tu cuenta está sujeta a aprobación municipal.',
        [{ text: 'ENTENDIDO', onPress: () => router.replace('/auth/login') }]
      );
    } catch (e: any) {
      Alert.alert('FALLO DEL SISTEMA', e.message || 'Error en el proceso de registro.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
      <View style={styles.header}>
        <Text style={styles.headerLabel}>// ALTA DE CONDUCTOR PROFESIONAL</Text>
        <Text style={styles.headerTitle}>REGISTRO DE <Text style={styles.accent}>OPERADOR</Text></Text>
      </View>

      <View style={styles.hazardContainer}>
        <LinearGradient
          colors={['#FF3300', '#000', '#FF3300', '#000']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.hazardStrip}
        />
      </View>

      <View style={styles.formPanel}>
        <Text style={styles.sectionTitle}>[ DATOS PERSONALES ]</Text>
        
        <View style={styles.inputBox}>
          <Text style={styles.label}>CONDUCTOR</Text>
          <TextInput
            style={styles.input}
            placeholder="NOMBRE Y APELLIDO"
            placeholderTextColor={theme.colors.muted}
            value={form.name}
            onChangeText={(v) => setForm({ ...form, name: v })}
          />
        </View>

        <View style={styles.inputBox}>
          <Text style={styles.label}>NRO. LICENCIA</Text>
          <TextInput
            style={styles.input}
            placeholder="LIC-0000000"
            placeholderTextColor={theme.colors.muted}
            value={form.licenseNum}
            onChangeText={(v) => setForm({ ...form, licenseNum: v })}
          />
        </View>

        <View style={styles.inputBox}>
          <Text style={styles.label}>TELÉFONO</Text>
          <TextInput
            style={styles.input}
            placeholder="04160000000"
            placeholderTextColor={theme.colors.muted}
            keyboardType="phone-pad"
            value={form.phone}
            onChangeText={(v) => setForm({ ...form, phone: v })}
          />
        </View>

        <View style={styles.inputBox}>
          <Text style={styles.label}>CONTRASEÑA</Text>
          <TextInput
            style={styles.input}
            placeholder="••••••••"
            placeholderTextColor={theme.colors.muted}
            secureTextEntry
            value={form.password}
            onChangeText={(v) => setForm({ ...form, password: v })}
          />
        </View>

        <Text style={[styles.sectionTitle, { marginTop: 20 }]}>[ DATOS DEL VEHÍCULO ]</Text>

        <View style={styles.row}>
          <View style={[styles.inputBox, { flex: 1 }]}>
            <Text style={styles.label}>PLACA</Text>
            <TextInput
              style={styles.input}
              placeholder="PLA-123"
              autoCapitalize="characters"
              placeholderTextColor={theme.colors.muted}
              value={form.vehicle.plate}
              onChangeText={(v) => setForm({ ...form, vehicle: { ...form.vehicle, plate: v } })}
            />
          </View>
          <View style={[styles.inputBox, { flex: 1, marginLeft: 10 }]}>
            <Text style={styles.label}>AÑO</Text>
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

        <View style={styles.inputBox}>
          <Text style={styles.label}>MARCA / MODELO</Text>
          <TextInput
            style={styles.input}
            placeholder="BMW / MOTOTRAK"
            placeholderTextColor={theme.colors.muted}
            value={form.vehicle.model}
            onChangeText={(v) => setForm({ ...form, vehicle: { ...form.vehicle, model: v } })}
          />
        </View>

        <TouchableOpacity 
          style={styles.submitBtn} 
          onPress={handleRegister}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#000" size="small" />
          ) : (
            <Text style={styles.submitBtnText}>ENVIAR SOLICITUD DE ALTA</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backBtnText}>REGRESAR</Text>
        </TouchableOpacity>
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
    fontSize: 28,
    fontWeight: '900',
    marginTop: theme.spacing.xs,
  },
  accent: {
    color: theme.colors.danger, // Drivers use Orange/Red as primary
  },
  hazardContainer: {
    height: 4,
    backgroundColor: '#000',
    marginVertical: theme.spacing.lg,
    overflow: 'hidden',
  },
  hazardStrip: {
    flex: 1,
  },
  formPanel: {
    gap: theme.spacing.md,
  },
  sectionTitle: {
    color: theme.colors.muted,
    fontFamily: theme.fonts.mono,
    fontSize: 14,
    marginBottom: 10,
    backgroundColor: theme.colors.surface,
    padding: 5,
  },
  inputBox: {
    gap: 4,
  },
  row: {
    flexDirection: 'row',
  },
  label: {
    color: theme.colors.muted,
    fontFamily: theme.fonts.mono,
    fontSize: 11,
  },
  input: {
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
    padding: theme.spacing.md,
    color: theme.colors.text,
    fontFamily: theme.fonts.mono,
    fontSize: 14,
  },
  submitBtn: {
    backgroundColor: theme.colors.danger,
    padding: theme.spacing.lg,
    alignItems: 'center',
    marginTop: 20,
  },
  submitBtnText: {
    color: '#000',
    fontWeight: 'bold',
    fontFamily: theme.fonts.mono,
  },
  backBtn: {
    padding: theme.spacing.md,
    alignItems: 'center',
  },
  backBtnText: {
    color: theme.colors.text,
    fontFamily: theme.fonts.mono,
    fontSize: 12,
  },
});
