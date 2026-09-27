import { Tabs } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Building2, FileSignature, Home, MessageCircle, User } from 'lucide-react-native';
import { useTheme } from '@getrentos/ui-native';
import { premiumTabBarOptions } from '@/lib/navigationStyles';

export default function OwnerTabsLayout() {
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
        name="properties"
        options={{
          title: 'Properties',
          tabBarIcon: ({ color, size }) => <Building2 color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="offers"
        options={{
          title: 'Offers',
          tabBarIcon: ({ color, size }) => <FileSignature color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="messages"
        options={{
          title: 'Messages',
          tabBarIcon: ({ color, size }) => <MessageCircle color={color} size={size} />,
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
