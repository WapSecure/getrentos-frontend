import { StyleSheet, Text, View } from 'react-native';

export default function ExploreScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Explore</Text>
      <Text style={styles.subtitle}>
        Shortlet and land marketplaces will appear here, backed by the same public API the web
        marketplace uses.
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
