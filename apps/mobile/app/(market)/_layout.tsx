import { Stack } from 'expo-router';

const SCREEN_OPTIONS = { headerShown: false, animation: 'slide_from_right' } as const;

/**
 * The public marketplace: browsable without an account, like the web's /rent,
 * /buy, /shortlets, /land and /estates. The root router lets signed-out
 * visitors stay here and moves signed-in users on to their portal.
 */
export default function MarketLayout() {
  return <Stack screenOptions={SCREEN_OPTIONS} />;
}
