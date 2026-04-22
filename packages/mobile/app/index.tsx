import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { theme } from '../src/theme/theme';

export default function Index() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <View style={styles.brandBox}>
          <Text style={styles.brandTitle}>CITY<Text style={styles.accent}>TRANSIT</Text></Text>
          <Text style={styles.brandSubtitle}>// MÓVIL APP V1.0</Text>
        </View>

        <View style={styles.actionsBox}>
          <TouchableOpacity 
            style={styles.btnPrimary} 
            activeOpacity={0.8}
            onPress={() => router.push('/auth/login')}
          >
            <Text style={styles.btnPrimaryText}>[ INICIAR SESIÓN ]</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.btnGhost} 
            activeOpacity={0.6}
            onPress={() => router.push('/auth/register')}
          >
            <Text style={styles.btnGhostText}>&gt; Registrarse como Cliente</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.bg,
    justifyContent: 'center',
    padding: theme.spacing.xl,
  },
  content: {
    flex: 1,
    justifyContent: 'space-around',
  },
  brandBox: {
    alignItems: 'center',
  },
  brandTitle: {
    fontSize: 42,
    fontWeight: '900',
    color: theme.colors.text,
    letterSpacing: 2,
  },
  accent: {
    color: theme.colors.accent,
  },
  brandSubtitle: {
    color: theme.colors.muted,
    fontFamily: theme.fonts.mono,
    fontSize: 12,
    marginTop: theme.spacing.sm,
    letterSpacing: 1,
  },
  actionsBox: {
    gap: theme.spacing.lg,
  },
  btnPrimary: {
    backgroundColor: theme.colors.accent,
    borderWidth: 2,
    borderColor: theme.colors.accent,
    paddingVertical: theme.spacing.md,
    alignItems: 'center',
  },
  btnPrimaryText: {
    color: '#000',
    fontFamily: theme.fonts.mono,
    fontWeight: 'bold',
    fontSize: 14,
    letterSpacing: 2,
  },
  btnGhost: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    paddingVertical: theme.spacing.md,
    alignItems: 'center',
  },
  btnGhostText: {
    color: theme.colors.text,
    fontFamily: theme.fonts.mono,
    fontSize: 12,
    letterSpacing: 1,
  }
});
