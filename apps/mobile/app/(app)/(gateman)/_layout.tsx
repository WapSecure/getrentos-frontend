import { Tabs } from 'expo-router';
import { Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Car, KeyRound, Package, Siren, User } from 'lucide-react-native';
import { useTheme } from '@getrentos/ui-native';

/**
 * The gate console.
 *
 * The Deliveries tab file is `gate-deliveries.tsx`, not `deliveries.tsx`,
 * deliberately: route groups don't contribute a URL segment, so a group screen
 * also answers on its bare path — `(gateman)/deliveries` and the top-level
 * `deliveries.tsx` (the resident deliveries screen) would both claim
 * `/deliveries`. Expo Router's generated types express routes as a union, so
 * that duplicate collapses silently and `tsc` will never flag it; the clash
 * only surfaces at runtime as a mis-resolved deep link. Migrating the shared
 * screens out of the top-level namespace is a bigger cleanup — until then, any
 * new portal tab whose name already exists at the top level needs a prefix.
 */
export default function GatemanTabsLayout() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.mutedForeground,
        tabBarStyle: {
          backgroundColor: colors.card,
          borderTopColor: colors.border,
          height: 52 + insets.bottom,
          paddingTop: 6,
          paddingBottom: insets.bottom,
        },
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: '600',
        },
        tabBarItemStyle: { paddingVertical: 2 },
        tabBarHideOnKeyboard: Platform.OS === 'android',
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Check-In',
          tabBarIcon: ({ color, size }) => <KeyRound color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="vehicles"
        options={{
          title: 'Vehicles',
          tabBarIcon: ({ color, size }) => <Car color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="gate-deliveries"
        options={{
          title: 'Deliveries',
          tabBarIcon: ({ color, size }) => <Package color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="incidents"
        options={{
          title: 'Incidents',
          tabBarIcon: ({ color, size }) => <Siren color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="account"
        options={{
          title: 'Account',
          tabBarIcon: ({ color, size }) => <User color={color} size={size} />,
        }}
      />
    </Tabs>
  );
}
