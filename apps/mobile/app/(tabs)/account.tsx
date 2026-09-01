import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useAuth } from '@/lib/auth';

export default function AccountScreen() {
  const { user, signOut } = useAuth();

  return (
    <View style={styles.container}>
      <View style={styles.avatar}>
        <Text style={styles.avatarText}>{user?.fullName?.charAt(0) ?? 'U'}</Text>
      </View>
      <Text style={styles.name}>{user?.fullName ?? 'GetRentos user'}</Text>
      <Text style={styles.email}>{user?.email ?? ''}</Text>

      <Pressable
        style={({ pressed }) => [styles.button, pressed && styles.buttonPressed]}
        onPress={signOut}
        accessibilityRole="button"
      >
        <Text style={styles.buttonText}>Sign out</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f7',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  avatar: {
    width: 84,
    height: 84,
    borderRadius: 42,
    backgroundColor: '#0071E3',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  avatarText: {
    color: '#ffffff',
    fontSize: 34,
    fontWeight: '800',
  },
  name: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1d1d1f',
  },
  email: {
    fontSize: 14,
    color: '#6e6e73',
    marginTop: 4,
  },
  button: {
    marginTop: 32,
    height: 50,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#d70015',
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'stretch',
  },
  buttonPressed: {
    opacity: 0.85,
  },
  buttonText: {
    color: '#d70015',
    fontSize: 16,
    fontWeight: '600',
  },
});
