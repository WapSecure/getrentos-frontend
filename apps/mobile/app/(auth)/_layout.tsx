import { Redirect, Stack } from 'expo-router';
import { useAuth } from '@/lib/auth';

/** Signed-out group. Redirects straight to the app once a session exists. */
export default function AuthLayout() {
  const { user } = useAuth();
  if (user) return <Redirect href="/" />;

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="sign-in" />
    </Stack>
  );
}
