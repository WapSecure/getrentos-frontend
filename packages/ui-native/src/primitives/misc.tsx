import { useEffect, useRef } from 'react';
import { Animated, Platform, Pressable, StyleSheet, View, type ViewProps } from 'react-native';
import { RotateCw, type SgIcon } from '@sureground/icons/native';
import { useTheme, withAlpha } from '../theme';
import { Text } from './Text';
import { useReducedMotion } from '../accessibility';

export function Divider({ style }: { style?: ViewProps['style'] }) {
  const { colors } = useTheme();
  return (
    <View style={[{ height: StyleSheet.hairlineWidth, backgroundColor: colors.border }, style]} />
  );
}

export type BadgeTone = 'neutral' | 'info' | 'success' | 'warning' | 'danger';

export type IconTileTone = 'primary' | 'success' | 'warning' | 'danger' | 'neutral';

const ICON_TILE_SIZE = { sm: 28, md: 36, lg: 44, xl: 56 } as const;

/**
 * A glyph on a soft tinted square: the brand blue by default, the status colours for figures and
 * notices that need them. Decorative, so it is hidden from screen readers; the row it sits in
 * carries the name.
 */
export function IconTile({
  Icon,
  tone = 'primary',
  size = 'md',
  style,
}: {
  Icon: SgIcon;
  tone?: IconTileTone;
  size?: keyof typeof ICON_TILE_SIZE;
  style?: ViewProps['style'];
}) {
  const { colors, radius } = useTheme();
  const fg = {
    primary: colors.primary,
    success: colors.success,
    warning: colors.warning,
    danger: colors.destructive,
    neutral: colors.mutedForeground,
  }[tone];
  const box = ICON_TILE_SIZE[size];
  return (
    <View
      accessible={false}
      importantForAccessibility="no-hide-descendants"
      accessibilityElementsHidden
      style={[
        {
          width: box,
          height: box,
          borderRadius: radius.lg,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: tone === 'neutral' ? colors.secondary : withAlpha(fg, 0.12),
        },
        style,
      ]}
    >
      <Icon size={Math.round(box * 0.46)} color={fg} />
    </View>
  );
}

export function Badge({ label, tone = 'neutral' }: { label: string; tone?: BadgeTone }) {
  const { colors, radius } = useTheme();
  // An unmapped status gives an empty label; render nothing rather than a blank pill.
  if (!label) return null;
  const map: Record<BadgeTone, { bg: string; fg: string }> = {
    neutral: { bg: colors.secondary, fg: colors.secondaryForeground },
    info: { bg: colors.infoSubtle, fg: colors.primary },
    success: { bg: colors.successSubtle, fg: colors.success },
    warning: { bg: colors.warningSubtle, fg: colors.warning },
    danger: { bg: colors.destructiveSubtle, fg: colors.destructive },
  };
  const c = map[tone];
  return (
    <View
      style={{
        alignSelf: 'flex-start',
        backgroundColor: c.bg,
        borderRadius: radius.full,
        paddingHorizontal: 10,
        paddingVertical: 3,
      }}
    >
      <Text variant="caption" style={{ color: c.fg, fontWeight: '600' }}>
        {label}
      </Text>
    </View>
  );
}

export function Avatar({ name, size = 40 }: { name?: string | null; size?: number }) {
  const { colors } = useTheme();
  const initials = (name ?? '')
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join('');
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: colors.accent,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Text style={{ color: colors.accentForeground, fontWeight: '700', fontSize: size * 0.4 }}>
        {initials || 'GR'}
      </Text>
    </View>
  );
}

export function Skeleton({
  height = 16,
  width = '100%',
  radius: r,
}: {
  height?: number;
  width?: number | `${number}%` | '100%';
  radius?: number;
}) {
  const { colors, radius } = useTheme();
  const reduceMotion = useReducedMotion();
  const pulse = useRef(new Animated.Value(0.5)).current;

  useEffect(() => {
    if (reduceMotion) {
      pulse.setValue(0.72);
      return;
    }
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 700, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0.5, duration: 700, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [pulse, reduceMotion]);

  return (
    <Animated.View
      accessible={Platform.OS === 'web' ? undefined : false}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={{
        height,
        width,
        borderRadius: r ?? radius.sm,
        backgroundColor: colors.secondary,
        opacity: pulse,
      }}
    />
  );
}

export function EmptyState({
  icon,
  title,
  description,
  action,
  size = 'default',
}: {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
  /** `compact` sits inside a card or section; `default` fills a screen. */
  size?: 'default' | 'compact';
}) {
  const { spacing } = useTheme();
  const compact = size === 'compact';
  return (
    <View
      accessibilityLiveRegion="polite"
      style={{
        alignItems: 'center',
        paddingVertical: compact ? spacing.xl : spacing['4xl'],
        paddingHorizontal: compact ? spacing.lg : 0,
        gap: compact ? spacing.xs : spacing.sm,
      }}
    >
      {icon}
      <Text variant={compact ? 'subheading' : 'heading'} headingLevel={compact ? 3 : 2} center>
        {title}
      </Text>
      {description ? (
        <Text
          variant={compact ? 'callout' : 'body'}
          color="mutedForeground"
          center
          style={{ maxWidth: 300 }}
        >
          {description}
        </Text>
      ) : null}
      {action ? <View style={{ marginTop: spacing.md }}>{action}</View> : null}
    </View>
  );
}

export function ErrorState({
  title = 'Something went wrong',
  description = 'Pull to refresh, or try again in a moment.',
  onRetry,
}: {
  title?: string;
  description?: string;
  onRetry?: () => void;
}) {
  const { colors, spacing, radius } = useTheme();
  return (
    <View
      accessibilityLiveRegion="polite"
      style={{ alignItems: 'center', paddingVertical: spacing['4xl'], gap: spacing.sm }}
    >
      <View
        style={{
          width: 44,
          height: 44,
          borderRadius: 22,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: colors.destructiveSubtle,
        }}
      >
        <RotateCw size={20} color={colors.destructive} />
      </View>
      <Text variant="heading" headingLevel={2} center>
        {title}
      </Text>
      <Text variant="body" color="mutedForeground" center style={{ maxWidth: 300 }}>
        {description}
      </Text>
      {onRetry ? (
        <Pressable
          onPress={onRetry}
          accessibilityRole="button"
          accessibilityLabel={`Try again: ${title}`}
          hitSlop={8}
          style={{
            marginTop: spacing.sm,
            paddingVertical: 9,
            paddingHorizontal: 18,
            borderRadius: radius.full,
            borderWidth: 1,
            borderColor: colors.border,
          }}
        >
          <Text variant="callout" color="primary" style={{ fontWeight: '700' }}>
            Try again
          </Text>
        </Pressable>
      ) : null}
    </View>
  );
}
