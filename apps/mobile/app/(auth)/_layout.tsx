import { Redirect, Stack } from 'expo-router';
import { useAuth } from '@/lib/auth/AuthProvider';

export default function AuthLayout() {
  const { status } = useAuth();
  if (status === 'authenticated') return <Redirect href="/(app)/(renter)" />;

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
        contentStyle: { backgroundColor: 'transparent' },
      }}
    >
      <Stack.Screen name="welcome" options={{ animation: 'fade' }} />
      <Stack.Screen name="sign-in" />
      <Stack.Screen name="forgot-password" />
      <Stack.Screen
        name="two-factor"
        options={{ presentation: 'modal', animation: 'slide_from_bottom' }}
      />
      <Stack.Screen name="sign-up" />
    </Stack>
  );
}
