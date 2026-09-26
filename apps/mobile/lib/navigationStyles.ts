import { Platform } from 'react-native';
import type { Palette } from '@getrentos/tokens';

/** Consistent, comfortably sized bottom navigation across every portal. */
export function premiumTabBarOptions(colors: Palette, bottomInset: number) {
  return {
    headerShown: false,
    tabBarActiveTintColor: colors.primary,
    tabBarInactiveTintColor: colors.mutedForeground,
    tabBarActiveBackgroundColor: colors.accent,
    tabBarStyle: {
      backgroundColor: colors.card,
      borderTopColor: colors.border,
      height: 62 + bottomInset,
      paddingTop: 7,
      paddingBottom: Math.max(bottomInset, 7),
    },
    tabBarLabelStyle: {
      fontSize: 11,
      lineHeight: 14,
      fontWeight: '600' as const,
    },
    tabBarItemStyle: {
      marginHorizontal: 3,
      marginVertical: 3,
      borderRadius: 14,
    },
    tabBarHideOnKeyboard: Platform.OS === 'android',
  };
}
