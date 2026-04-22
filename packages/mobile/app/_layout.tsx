import { Slot } from 'expo-router';
import { View, StatusBar, StyleSheet } from 'react-native';
import { theme } from '../src/theme/theme';

import { AuthProvider } from '../src/context/AuthContext';
// Import the task definition to ensure it is registered
import '../src/services/locationTask';

export default function RootLayout() {
  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={theme.colors.bg} />
      <AuthProvider>
        <Slot />
      </AuthProvider>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.bg,
  },
});
