import { Stack } from 'expo-router';
import { theme } from '../../src/theme/theme';

export default function AuthLayout() {
  return (
    <Stack screenOptions={{
      headerStyle: { backgroundColor: theme.colors.surface },
      headerTintColor: theme.colors.accent,
      headerTitleStyle: { fontFamily: theme.fonts.mono, letterSpacing: 2 },
      contentStyle: { backgroundColor: theme.colors.bg },
      headerShadowVisible: false,
    }}>
      <Stack.Screen name="login" options={{ title: 'ACCESO', headerTitleAlign: 'center' }} />
      <Stack.Screen name="register" options={{ title: 'REGISTRO CLIENTE', headerTitleAlign: 'center' }} />
      <Stack.Screen name="register-driver" options={{ title: 'REGISTRO CONDUCTOR', headerTitleAlign: 'center' }} />
    </Stack>
  );
}
