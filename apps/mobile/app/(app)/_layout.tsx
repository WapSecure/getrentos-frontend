import { Redirect, Stack } from 'expo-router';
import { useAuth } from '@/lib/auth/AuthProvider';
import { IMPLEMENTED_PORTALS } from '@/lib/roles';

/**
 * Authenticated shell. Redirects out when there's no session, and routes the
 * account to its portal group. Portals without a mobile build yet land on a
 * holding screen instead of a dead route.
 */
export default function AppLayout() {
  const { status, portal } = useAuth();

  if (status === 'loading') return null;
  if (status === 'unauthenticated' || !portal) return <Redirect href="/(auth)/sign-in" />;

  if (!IMPLEMENTED_PORTALS.includes(portal)) {
    return <Redirect href="/(app)/portal-unavailable" />;
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(renter)" />
      <Stack.Screen name="portal-unavailable" options={{ presentation: 'modal' }} />
    </Stack>
  );
}
