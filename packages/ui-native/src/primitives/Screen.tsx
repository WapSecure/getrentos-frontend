import type { ReactNode } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  RefreshControl,
  ScrollView,
  StyleSheet,
  View,
  type ScrollViewProps,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../theme';

export interface ScreenProps {
  children: ReactNode;
  /** Wrap content in a ScrollView (default) or render it flush for custom lists. */
  scroll?: boolean;
  refreshing?: boolean;
  onRefresh?: () => void;
  /** Horizontal gutter. Set 0 for edge-to-edge lists. */
  padded?: boolean;
  contentContainerStyle?: ScrollViewProps['contentContainerStyle'];
  /** Sticky footer (e.g. a primary action) that clears the home indicator. */
  footer?: ReactNode;
}

/**
 * Every screen's outermost element. Handles safe-area insets, the keyboard,
 * pull-to-refresh, and the themed background so screens never re-solve it.
 */
export function Screen({
  children,
  scroll = true,
  refreshing = false,
  onRefresh,
  padded = true,
  contentContainerStyle,
  footer,
}: ScreenProps) {
  const { colors, spacing } = useTheme();
  const insets = useSafeAreaInsets();

  const body = scroll ? (
    <ScrollView
      keyboardShouldPersistTaps="handled"
      keyboardDismissMode="on-drag"
      showsVerticalScrollIndicator={false}
      contentContainerStyle={[
        {
          paddingHorizontal: padded ? spacing.xl : 0,
          paddingTop: spacing.lg,
          paddingBottom: insets.bottom + spacing['3xl'],
          gap: spacing.lg,
        },
        contentContainerStyle,
      ]}
      refreshControl={
        onRefresh ? (
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.mutedForeground}
          />
        ) : undefined
      }
    >
      {children}
    </ScrollView>
  ) : (
    <View style={{ flex: 1, paddingHorizontal: padded ? spacing.xl : 0 }}>{children}</View>
  );

  return (
    <KeyboardAvoidingView
      style={[styles.flex, { backgroundColor: colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      {body}
      {footer ? (
        <View
          style={[
            styles.footer,
            {
              paddingHorizontal: spacing.xl,
              paddingTop: spacing.md,
              paddingBottom: insets.bottom + spacing.md,
              backgroundColor: colors.background,
              borderTopColor: colors.border,
            },
          ]}
        >
          {footer}
        </View>
      ) : null}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  footer: { borderTopWidth: StyleSheet.hairlineWidth },
});
