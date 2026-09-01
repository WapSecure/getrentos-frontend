import { Redirect, Tabs } from 'expo-router';
import { Home, Compass, User } from 'lucide-react-native';
import { useAuth } from '@/lib/auth';

/** Signed-in tab navigator. Redirects to sign-in when no session exists. */
export default function TabsLayout() {
  const { user } = useAuth();
  if (!user) return <Redirect href="/sign-in" />;

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#0071E3',
        tabBarInactiveTintColor: '#98989d',
        headerShown: true,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, size }) => <Home color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="explore"
        options={{
          title: 'Explore',
          tabBarIcon: ({ color, size }) => <Compass color={color} size={size} />,
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
