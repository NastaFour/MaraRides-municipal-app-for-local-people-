import React, { useState, useContext } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { request, setToken } from '../../src/services/api';
import { setUser } from '../../src/utils/storage';
import { AuthContext } from '../../src/context/AuthContext';
import { theme } from '../../src/theme/theme';

export default function LoginScreen() {
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMSG, setErrorMSG] = useState<string | null>(null);
  
  const { loginSession } = useContext(AuthContext);
  const router = useRouter();

  const handleLogin = async () => {
    if (!phone || !password) {
      setErrorMSG('Campos requeridos');
      return;
    }

    setLoading(true);
    setErrorMSG(null);
    try {
      // Driver and Client share the same underlying schema for basic auth depending on endpoint
      // We will try both if we don't strictly know. Usually an app has strict separate flows.
      // But according to our routes: /auth/client/login, /auth/driver/login.
      // We can try to authenticate as Client first, if 401/404, fallback to Driver API?
      // Better: Have a toggle for "Soy Conductor" or try client, then try driver.
      // For simplicity matching phase 2, let's try Driver if "Soy Conductor" checkbox was active.
      // Let's implement an elegant attempt for both.
      
      let res;
      try {
        res = await request<{ token: string; user: any }>('/auth/client/login', {
          method: 'POST',
          body: JSON.stringify({ phone, password }),
          skipAuth: true
        });
      } catch (e: any) {
        // If client fails, try driver
        res = await request<any>('/auth/driver/login', {
          method: 'POST',
          body: JSON.stringify({ phone, password }),
          skipAuth: true
        });
        // Normalize driver payload to user schema for context
        res.user = { ...res.driver, role: 'DRIVER' };
      }

      await setToken(res.token);
      await setUser(res.user);
      loginSession(res.user);
      // router handles redirection via AuthContext effect
    } catch (e: any) {
      setErrorMSG(e.message || 'Credenciales inválidas');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>AUTORIZACIÓN REQUERIDA</Text>
      
      <View style={styles.panel}>
        <Text style={styles.sysId}>// PORTAL DE ACCESO V1.0</Text>
        
        {errorMSG && <Text style={styles.errorText}>⚠ {errorMSG}</Text>}

        <View style={styles.inputGroup}>
          <Text style={styles.label}>&gt; TELÉFONO</Text>
          <TextInput
            style={styles.input}
            placeholder="0000000000"
            placeholderTextColor={theme.colors.muted}
            keyboardType="phone-pad"
            value={phone}
            onChangeText={setPhone}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>&gt; CONTRASEÑA</Text>
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
        >
          {loading ? (
            <ActivityIndicator color="#000" size="small" />
          ) : (
            <Text style={styles.btnPrimaryText}>[ ACCEDER ]</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.btnDriverReg} 
          onPress={() => router.push('/auth/register-driver')}
        >
          <Text style={styles.btnDriverRegText}>Quiero ser conductor</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: theme.spacing.lg,
    justifyContent: 'center',
  },
  title: {
    fontFamily: theme.fonts.mono,
    fontSize: 16,
    color: theme.colors.accent,
    marginBottom: theme.spacing.lg,
    fontWeight: 'bold',
    letterSpacing: 2,
    textAlign: 'center',
  },
  panel: {
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
    padding: theme.spacing.lg,
    borderTopWidth: 2,
    borderTopColor: theme.colors.accent,
    borderLeftWidth: 2,
    borderLeftColor: theme.colors.accent,
  },
  sysId: {
    fontFamily: theme.fonts.mono,
    color: theme.colors.muted,
    fontSize: 12,
    marginBottom: theme.spacing.xl,
  },
  inputGroup: {
    marginBottom: theme.spacing.lg,
  },
  label: {
    fontFamily: theme.fonts.mono,
    color: theme.colors.muted,
    fontSize: 12,
    marginBottom: theme.spacing.sm,
    letterSpacing: 1,
  },
  input: {
    fontFamily: theme.fonts.mono,
    color: theme.colors.text,
    borderWidth: 1,
    borderColor: theme.colors.border,
    padding: theme.spacing.md,
    fontSize: 16,
  },
  btnPrimary: {
    backgroundColor: theme.colors.accent,
    padding: theme.spacing.md,
    alignItems: 'center',
    marginTop: theme.spacing.md,
  },
  btnPrimaryText: {
    color: '#000',
    fontFamily: theme.fonts.mono,
    fontWeight: 'bold',
    letterSpacing: 2,
  },
  btnDriverReg: {
    marginTop: theme.spacing.xl,
    alignItems: 'center',
  },
  btnDriverRegText: {
    color: theme.colors.cyan,
    fontFamily: theme.fonts.mono,
    fontSize: 12,
    textDecorationLine: 'underline',
  },
  errorText: {
    color: theme.colors.danger,
    fontFamily: theme.fonts.mono,
    fontSize: 12,
    marginBottom: theme.spacing.md,
    padding: theme.spacing.sm,
    backgroundColor: 'rgba(255,51,0,0.1)',
    borderWidth: 1,
    borderColor: theme.colors.danger,
  }
});
