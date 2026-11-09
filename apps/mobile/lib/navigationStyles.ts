import { Platform } from 'react-native';
import type { Palette } from '@sureground/tokens';

/** Consistent, comfortably sized bottom navigation across every portal. */
export function premiumTabBarOptions(colors: Palette, bottomInset: number) {
  return {
    headerShown: false,
    tabBarActiveTintColor: colors.primary,
    tabBarInactiveTintColor: colors.mutedForeground,
    tabBarStyle: {
      backgroundColor: colors.card,
      borderTopColor: colors.border,
      // Icon (24) + label (14) + item margins (6) need 50px clear; 62 clipped
      // the labels on phones without a bottom inset.
      height: 68 + bottomInset,
      paddingTop: 6,
      paddingBottom: Math.max(bottomInset, 6),
    },
    tabBarLabelStyle: {
      fontSize: 11,
      lineHeight: 14,
      fontWeight: '600' as const,
    },
    tabBarItemStyle: {
      paddingTop: 2,
    },
    tabBarHideOnKeyboard: Platform.OS === 'android',
  };
}
