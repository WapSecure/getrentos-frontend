import { Tabs } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Building2, Home, MessageCircle, User, Users } from '@sureground/icons/native';
import { useTheme } from '@sureground/ui-native';
import { tabIcon } from '@/components/navigation/TabIcon';
import { premiumTabBarOptions } from '@/lib/navigationStyles';

export default function LandlordTabsLayout() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <Tabs screenOptions={premiumTabBarOptions(colors, insets.bottom)}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: tabIcon(Home),
        }}
      />
      <Tabs.Screen
        name="properties"
        options={{
          title: 'Properties',
          tabBarIcon: tabIcon(Building2),
        }}
      />
      <Tabs.Screen
        name="tenants"
        options={{
          title: 'Tenants',
          tabBarIcon: tabIcon(Users),
        }}
      />
      <Tabs.Screen
        name="messages"
        options={{
          title: 'Messages',
          tabBarIcon: tabIcon(MessageCircle),
        }}
      />
      <Tabs.Screen
        name="account"
        options={{
          title: 'Account',
          tabBarIcon: tabIcon(User),
        }}
      />
    </Tabs>
  );
}
