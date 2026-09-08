import type { ReactNode } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { ChevronLeft } from 'lucide-react-native';
import { useTheme } from '../theme';
import { Text } from './Text';
import { Progress } from './Progress';

export interface AuthScaffoldProps {
  children: ReactNode;
  title: string;
  subtitle?: string;
  /** Eyebrow above the title. */
  kicker?: string;
  onBack?: () => void;
  /** 0…1 — renders a progress bar under the header when set. */
  progress?: number;
  /** Sticky footer (primary action) above the home indicator. */
  footer?: ReactNode;
}

/**
 * The shared shell for every onboarding screen: safe-area, keyboard handling,
 * a light back affordance, an optional step progress bar, a large title block
 * that animates in, and a sticky footer for the primary action.
 */
export function AuthScaffold({
  children,
  title,
  subtitle,
  kicker,
  onBack,
  progress,
  footer,
}: AuthScaffoldProps) {
  const { colors, spacing } = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <KeyboardAvoidingView
      style={[styles.flex, { backgroundColor: colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={{ paddingTop: insets.top + spacing.sm, paddingHorizontal: spacing.xl }}>
        <View style={styles.headerRow}>
          {onBack ? (
            <Pressable
              onPress={onBack}
              hitSlop={12}
              accessibilityRole="button"
              accessibilityLabel="Go back"
              style={[styles.backBtn, { backgroundColor: colors.secondary }]}
            >
              <ChevronLeft size={22} color={colors.foreground} />
            </Pressable>
          ) : (
            <View style={styles.backBtn} />
          )}
        </View>
        {progress !== undefined ? (
          <View style={{ marginTop: spacing.md }}>
            <Progress value={progress} />
          </View>
        ) : null}
      </View>

      <ScrollView
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingHorizontal: spacing.xl,
          paddingTop: spacing.xl,
          paddingBottom: spacing['4xl'],
          gap: spacing['2xl'],
        }}
      >
        <Animated.View entering={FadeInUp.duration(320)} style={{ gap: spacing.xs }}>
          {kicker ? (
            <Text variant="label" color="primary" uppercase>
              {kicker}
            </Text>
          ) : null}
          <Text variant="title">{title}</Text>
          {subtitle ? (
            <Text variant="body" color="mutedForeground">
              {subtitle}
            </Text>
          ) : null}
        </Animated.View>

        <Animated.View entering={FadeInDown.duration(340).delay(60)}>{children}</Animated.View>
      </ScrollView>

      {footer ? (
        <View
          style={{
            paddingHorizontal: spacing.xl,
            paddingTop: spacing.md,
            paddingBottom: insets.bottom + spacing.md,
            gap: spacing.sm,
          }}
        >
          {footer}
        </View>
      ) : null}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  headerRow: { flexDirection: 'row', alignItems: 'center', minHeight: 40 },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
