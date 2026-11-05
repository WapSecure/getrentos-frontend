import { Stack } from 'expo-router';

const SCREEN_OPTIONS = { headerShown: false, animation: 'slide_from_right' } as const;

/**
 * Public profile pages: a landlord's or agency's page (website /l/<slug>) and
 * an estate's page (/e/<slug>). Unlike the market, these stay open to people
 * who are signed in, because they are what someone shares.
 */
export default function PublicLayout() {
  return <Stack screenOptions={SCREEN_OPTIONS} />;
}
