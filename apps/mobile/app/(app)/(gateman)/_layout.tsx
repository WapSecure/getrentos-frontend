import { Tabs } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Car, KeyRound, Menu, Package, UserCheck } from '@sureground/icons/native';
import { useTheme } from '@sureground/ui-native';
import { GateQueueSync } from '@/components/gateman/GateQueueSync';
import { GatemanPostProvider } from '@/lib/gateman/GatemanPostProvider';
import { premiumTabBarOptions } from '@/lib/navigationStyles';

// Tab files that share a name with a top-level screen take a `gate-` prefix: a group screen also answers on its bare path, and Expo Router's typed-route union hides the clash from tsc until a deep link mis-resolves at runtime.
export default function GatemanTabsLayout() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();

  return (
    // One estate and gate for every tab, or an entry could be admitted in one estate and checked out in another.
    <GatemanPostProvider>
      {/* Mounted here, not at the app root, so the queue drains while a guard is at the gate. */}
      <GateQueueSync />
      <Tabs screenOptions={premiumTabBarOptions(colors, insets.bottom)}>
        <Tabs.Screen
          name="index"
          options={{
            title: 'Check-In',
            tabBarIcon: ({ color, size }) => <KeyRound color={color} size={size} />,
          }}
        />
        {/* Read-only: nothing on it opens the barrier. */}
        <Tabs.Screen
          name="gate-expected"
          options={{
            title: 'Expected',
            tabBarIcon: ({ color, size }) => <UserCheck color={color} size={size} />,
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
          name="gate-patrol"
          options={{
            href: null,
          }}
        />
        <Tabs.Screen
          name="incidents"
          options={{
            href: null,
          }}
        />
        <Tabs.Screen
          name="account"
          options={{
            title: 'More',
            tabBarIcon: ({ color, size }) => <Menu color={color} size={size} />,
          }}
        />
      </Tabs>
    </GatemanPostProvider>
  );
}
