import { Platform, StyleSheet } from 'react-native';
import { shadows, type Palette } from '@sureground/tokens';

/** Every tab icon draws at this size, whatever React Navigation suggests for the device. */
export const TAB_ICON_SIZE = 22;
/** The blue pill behind the active tab's icon. 52 wide still fits five tabs on a 320pt phone. */
export const TAB_PILL = { width: 52, height: 28 } as const;

/**
 * One tab bar for every role: an elevated card bar with a soft lift off the canvas, the active
 * tab in Sureground blue on a tinted pill (see `tabIcon`), and the rest in muted ink.
 */
export function premiumTabBarOptions(colors: Palette, bottomInset: number) {
  return {
    headerShown: false,
    tabBarActiveTintColor: colors.primary,
    tabBarInactiveTintColor: colors.mutedForeground,
    tabBarStyle: {
      backgroundColor: colors.card,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: colors.border,
      // The pill (28), its gap and the label need 55pt with the item's own padding; 72 leaves room
      // on phones without a bottom inset, and each tab stays well over 44pt tall.
      height: 72 + bottomInset,
      paddingTop: 6,
      paddingBottom: Math.max(bottomInset, 8),
      paddingHorizontal: 4,
      // A soft lift so the bar reads as a surface above the canvas rather than a ruled-off strip.
      ...shadows.sm,
      shadowOpacity: 0.06,
      shadowRadius: 16,
      shadowOffset: { width: 0, height: -4 },
      elevation: 12,
    },
    tabBarIconStyle: {
      width: TAB_PILL.width,
      height: TAB_PILL.height,
    },
    tabBarLabelStyle: {
      fontSize: 11,
      lineHeight: 14,
      fontWeight: '600' as const,
      marginTop: 3,
    },
    tabBarHideOnKeyboard: Platform.OS === 'android',
  };
}
