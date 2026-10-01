import { Tabs } from 'expo-router';
import { Building2, User } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@getrentos/ui-native';
import { premiumTabBarOptions } from '@/lib/navigationStyles';

export default function EstateTabsLayout() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  return (
    <Tabs screenOptions={premiumTabBarOptions(colors, insets.bottom)}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Estate',
          tabBarIcon: ({ color, size }) => <Building2 color={color} size={size} />,
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
