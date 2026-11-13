import { Tabs } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { FileSignature, Home, MessageCircle, Search, User } from '@sureground/icons/native';
import { useTheme } from '@sureground/ui-native';
import { tabIcon } from '@/components/navigation/TabIcon';
import { premiumTabBarOptions } from '@/lib/navigationStyles';

export default function BuyerTabsLayout() {
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
        name="discover"
        options={{
          title: 'Discover',
          tabBarIcon: tabIcon(Search),
        }}
      />
      <Tabs.Screen
        name="offers"
        options={{
          title: 'Offers',
          tabBarIcon: tabIcon(FileSignature),
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
