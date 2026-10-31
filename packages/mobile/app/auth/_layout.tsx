import { Stack } from 'expo-router';
import { theme } from '../../src/theme/theme';

export default function AuthLayout() {
  return (
    <Stack screenOptions={{
      headerStyle: { backgroundColor: theme.colors.surface },
      headerTintColor: theme.colors.accent,
      headerTitleStyle: { fontWeight: '700' },
      contentStyle: { backgroundColor: theme.colors.bg },
      headerShadowVisible: false,
    }}>
      <Stack.Screen name="login" options={{ headerShown: false }} />
      <Stack.Screen name="register" options={{ title: 'Registro de Pasajero', headerTitleAlign: 'center' }} />
      <Stack.Screen name="register-driver" options={{ title: 'Registro de Conductor', headerTitleAlign: 'center' }} />
    </Stack>
  );
}
