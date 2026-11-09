import { Stack } from 'expo-router';

const SCREEN_OPTIONS = { headerShown: false, animation: 'slide_from_right' } as const;

/** Unlike the market, these stay open to signed-in people, because they are what someone shares. */
export default function PublicLayout() {
  return <Stack screenOptions={SCREEN_OPTIONS} />;
}
