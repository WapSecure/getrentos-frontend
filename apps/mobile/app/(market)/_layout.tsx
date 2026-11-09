import { Stack } from 'expo-router';

const SCREEN_OPTIONS = { headerShown: false, animation: 'slide_from_right' } as const;

/** Browsable without an account; the root router moves signed-in users on to their portal. */
export default function MarketLayout() {
  return <Stack screenOptions={SCREEN_OPTIONS} />;
}
