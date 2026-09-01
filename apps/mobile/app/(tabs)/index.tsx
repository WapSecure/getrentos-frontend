import { StyleSheet, Text, View } from 'react-native';
import { useAuth } from '@/lib/auth';

export default function HomeScreen() {
  const { user } = useAuth();

  return (
    <View style={styles.container}>
      <Text style={styles.eyebrow}>WELCOME BACK</Text>
      <Text style={styles.title}>Hi, {user?.fullName?.split(' ')[0] ?? 'there'} 👋</Text>
      <Text style={styles.subtitle}>
        This is the foundation of the GetRentos mobile app. Role dashboards (renter, landlord,
        owner, buyer, realtor, agent…) plug into this shell.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f7',
    padding: 24,
    justifyContent: 'center',
  },
  eyebrow: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0071E3',
    letterSpacing: 1,
    marginBottom: 8,
  },
  title: {
    fontSize: 30,
    fontWeight: '800',
    color: '#1d1d1f',
  },
  subtitle: {
    fontSize: 15,
    color: '#6e6e73',
    lineHeight: 22,
    marginTop: 12,
  },
});
