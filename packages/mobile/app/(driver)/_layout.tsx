import { Stack } from 'expo-router';
import { theme } from '../../src/theme/theme';

export default function DriverLayout() {
  return (
    <Stack screenOptions={{
      headerStyle: { backgroundColor: theme.colors.surface },
      headerTintColor: theme.colors.accent,
      headerTitleStyle: { fontWeight: '700' },
      contentStyle: { backgroundColor: theme.colors.bg },
      headerShadowVisible: false,
    }}>
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen name="history" options={{ title: 'Mis Ganancias', headerTitleAlign: 'center' }} />
    </Stack>
  );
}
