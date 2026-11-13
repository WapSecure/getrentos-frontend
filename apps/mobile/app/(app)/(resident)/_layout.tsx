import { Tabs } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Home, Megaphone, Users2, User } from '@sureground/icons/native';
import { useTheme } from '@sureground/ui-native';
import { tabIcon } from '@/components/navigation/TabIcon';
import { premiumTabBarOptions } from '@/lib/navigationStyles';

export default function ResidentTabsLayout() {
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
        name="announcements"
        options={{
          title: 'Announcements',
          tabBarIcon: tabIcon(Megaphone),
        }}
      />
      <Tabs.Screen
        name="community"
        options={{
          title: 'Community',
          tabBarIcon: tabIcon(Users2),
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
