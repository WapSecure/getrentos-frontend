import { Stack } from 'expo-router';

// Hoisted so the navigator never sees a fresh options object on re-render.
const SCREEN_OPTIONS = {
  headerShown: false,
  animation: 'slide_from_right',
  contentStyle: { backgroundColor: 'transparent' },
} as const;
const WELCOME_OPTIONS = { animation: 'fade' } as const;
const TWO_FACTOR_OPTIONS = { presentation: 'modal', animation: 'slide_from_bottom' } as const;

/**
 * Unauthenticated flow. No redirect here — the root `useProtectedRoute` decides
 * when to leave this group. Keeping it a plain navigator avoids the nested
 * redirect war that trips the native stack.
 */
export default function AuthLayout() {
  return (
    <Stack screenOptions={SCREEN_OPTIONS}>
      <Stack.Screen name="welcome" options={WELCOME_OPTIONS} />
      <Stack.Screen name="sign-in" />
      <Stack.Screen name="forgot-password" />
      <Stack.Screen name="two-factor" options={TWO_FACTOR_OPTIONS} />
      <Stack.Screen name="sign-up" />
    </Stack>
  );
}
