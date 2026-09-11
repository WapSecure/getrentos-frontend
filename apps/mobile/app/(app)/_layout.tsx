import { Stack } from 'expo-router';

const SCREEN_OPTIONS = { headerShown: false } as const;
const PORTAL_UNAVAILABLE_OPTIONS = { presentation: 'modal' } as const;
const DETAIL_OPTIONS = { animation: 'slide_from_right' } as const;

/**
 * Authenticated shell. No redirect here — the root `useProtectedRoute` keeps an
 * anonymous user out and routes unbuilt portals to the holding screen. This
 * layout just declares the navigator.
 */
export default function AppLayout() {
  return (
    <Stack screenOptions={SCREEN_OPTIONS}>
      <Stack.Screen name="(renter)" />
      <Stack.Screen name="(resident)" />
      <Stack.Screen name="property/[id]" options={DETAIL_OPTIONS} />
      <Stack.Screen name="property/[id]/apply" options={DETAIL_OPTIONS} />
      <Stack.Screen name="application/[id]" options={DETAIL_OPTIONS} />
      <Stack.Screen name="saved" options={DETAIL_OPTIONS} />
      <Stack.Screen name="verify-identity" options={DETAIL_OPTIONS} />
      <Stack.Screen name="violations" options={DETAIL_OPTIONS} />
      <Stack.Screen name="deliveries" options={DETAIL_OPTIONS} />
      <Stack.Screen name="directory" options={DETAIL_OPTIONS} />
      <Stack.Screen name="polls" options={DETAIL_OPTIONS} />
      <Stack.Screen name="committee" options={DETAIL_OPTIONS} />
      <Stack.Screen name="portal-unavailable" options={PORTAL_UNAVAILABLE_OPTIONS} />
    </Stack>
  );
}
