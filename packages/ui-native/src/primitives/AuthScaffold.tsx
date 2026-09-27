import type { ReactNode } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { ChevronLeft } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../theme';
import { Text } from './Text';
import { Progress } from './Progress';
import { BrandLogo } from './BrandLogo';
import { IconButton } from './IconButton';
import { useReducedMotion } from '../accessibility';

export interface AuthScaffoldProps {
  children: ReactNode;
  title: string;
  subtitle?: string;
  /** Eyebrow above the title. */
  kicker?: string;
  onBack?: () => void;
  /** 0…1 — renders a progress bar under the header when set. */
  progress?: number;
  /** Spoken with the progress bar, e.g. "Step 2 of 3". */
  progressLabel?: string;
  /** Sticky footer (primary action) above the home indicator. */
  footer?: ReactNode;
}

/**
 * The shared shell for every onboarding screen: safe-area, keyboard handling,
 * a 44-point back affordance, an optional step progress bar, a large title
 * that animates in, and a sticky footer for the primary action.
 */
export function AuthScaffold({
  children,
  title,
  subtitle,
  kicker,
  onBack,
  progress,
  progressLabel,
  footer,
}: AuthScaffoldProps) {
  const { colors, spacing } = useTheme();
  const insets = useSafeAreaInsets();
  const reduceMotion = useReducedMotion();

  return (
    <KeyboardAvoidingView
      style={[styles.flex, { backgroundColor: colors.background }]}
      // Android runs edge-to-edge, so the window no longer resizes for the
      // keyboard — pad on both platforms or the sticky footer ends up under it.
      behavior={Platform.OS === 'web' ? undefined : 'padding'}
    >
      <LinearGradient
        pointerEvents="none"
        colors={[colors.accent, colors.background]}
        style={styles.brandWash}
      />
      <View style={{ paddingTop: insets.top + spacing.sm, paddingHorizontal: spacing.xl }}>
        <View style={styles.headerRow}>
          {onBack ? (
            <IconButton
              onPress={onBack}
              haptic={false}
              accessibilityLabel="Go back"
              icon={<ChevronLeft size={22} color={colors.foreground} />}
            />
          ) : (
            <View style={styles.backSpacer} />
          )}
          <View importantForAccessibility="no-hide-descendants" accessibilityElementsHidden>
            <BrandLogo size={20} />
          </View>
          <View style={styles.backSpacer} />
        </View>
        {progress !== undefined ? (
          <View style={{ marginTop: spacing.md }}>
            <Progress value={progress} accessibilityLabel={progressLabel ?? 'Progress'} />
          </View>
        ) : null}
      </View>

      <ScrollView
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="interactive"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingHorizontal: spacing.xl,
          paddingTop: spacing['2xl'],
          paddingBottom: spacing['3xl'],
          gap: spacing['2xl'],
        }}
      >
        <Animated.View
          entering={reduceMotion ? undefined : FadeInUp.duration(320)}
          style={{ gap: spacing.xs }}
        >
          {kicker ? (
            <Text variant="label" color="primary" uppercase>
              {kicker}
            </Text>
          ) : null}
          <Text
            variant="display"
            accessibilityRole="header"
            style={{ fontSize: 30, lineHeight: 36, letterSpacing: -0.8 }}
          >
            {title}
          </Text>
          {subtitle ? (
            <Text variant="body" color="mutedForeground" style={{ marginTop: spacing.xxs }}>
              {subtitle}
            </Text>
          ) : null}
        </Animated.View>

        <Animated.View entering={reduceMotion ? undefined : FadeInDown.duration(340).delay(60)}>
          {children}
        </Animated.View>
      </ScrollView>

      {footer ? (
        <View
          style={{
            paddingHorizontal: spacing.xl,
            paddingTop: spacing.md,
            paddingBottom: insets.bottom + spacing.md,
            gap: spacing.xs,
            borderTopWidth: StyleSheet.hairlineWidth,
            borderTopColor: colors.border,
            backgroundColor: colors.card,
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
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 44,
  },
  brandWash: { position: 'absolute', top: 0, left: 0, right: 0, height: 360 },
  backSpacer: { width: 44, height: 44 },
});
