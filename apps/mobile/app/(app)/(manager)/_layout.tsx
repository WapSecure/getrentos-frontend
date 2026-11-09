import { Tabs } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { FileSignature, Home, MessageSquareText, User, Users } from 'lucide-react-native';
import { useTheme } from '@sureground/ui-native';
import { premiumTabBarOptions } from '@/lib/navigationStyles';

// The custody provider sits above these tabs and the screens pushed over them, so they all agree on the selected client.
export default function ManagerTabsLayout() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <Tabs screenOptions={premiumTabBarOptions(colors, insets.bottom)}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, size }) => <Home color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="clients"
        options={{
          title: 'Clients',
          tabBarIcon: ({ color, size }) => <Users color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="engagements"
        options={{
          title: 'Engagements',
          tabBarIcon: ({ color, size }) => <FileSignature color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="questions"
        options={{
          title: 'Questions',
          tabBarIcon: ({ color, size }) => <MessageSquareText color={color} size={size} />,
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
