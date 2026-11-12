import type { ReactNode } from 'react';
import { Image, Pressable, useWindowDimensions, View } from 'react-native';
import { Text, useTheme } from '@sureground/ui-native';
import type { IssuedVisitorPass } from '@/lib/api/visitor-pass';
import { formatDateTime } from '@/lib/format';

export type VisitorTone = 'active' | 'waiting' | 'finished';

export function visitorInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  const letters = parts.length > 1 ? [parts[0][0], parts[parts.length - 1][0]] : [parts[0]?.[0]];
  return letters.filter(Boolean).join('').toUpperCase() || '?';
}

/** Decorative: the visitor's name is always written beside it, so screen readers skip it. */
export function VisitorInitials({
  name,
  tone = 'active',
  size = 44,
}: {
  name: string;
  tone?: VisitorTone;
  size?: number;
}) {
  const { colors } = useTheme();
  const palette: Record<VisitorTone, { bg: string; fg: string; border: string }> = {
    active: { bg: colors.accent, fg: colors.accentForeground, border: colors.border },
    waiting: { bg: colors.warningSubtle, fg: colors.warning, border: colors.warningSubtle },
    finished: { bg: colors.secondary, fg: colors.mutedForeground, border: colors.secondary },
  };
  const c = palette[tone];
  return (
    <View
      accessible={false}
      importantForAccessibility="no-hide-descendants"
      accessibilityElementsHidden
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: c.bg,
        borderWidth: 1,
        borderColor: c.border,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Text style={{ color: c.fg, fontWeight: '700', fontSize: Math.round(size * 0.36) }}>
        {visitorInitials(name)}
      </Text>
    </View>
  );
}

/** A small uppercase label above a group of cards, with an optional count. */
export function GroupLabel({
  label,
  count,
  icon,
  tone = 'muted',
}: {
  label: string;
  count?: number;
  icon?: ReactNode;
  tone?: 'muted' | 'urgent';
}) {
  const { colors, spacing, radius } = useTheme();
  const urgent = tone === 'urgent';
  return (
    <View
      accessible
      accessibilityRole="header"
      accessibilityLabel={typeof count === 'number' ? `${label}, ${count}` : label}
      style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.xs }}
    >
      {icon}
      <Text
        variant="label"
        uppercase
        style={{ color: urgent ? colors.warning : colors.mutedForeground, letterSpacing: 0.8 }}
      >
        {label}
      </Text>
      {typeof count === 'number' ? (
        <View
          style={{
            minWidth: 20,
            paddingHorizontal: 6,
            paddingVertical: 1,
            borderRadius: radius.full,
            alignItems: 'center',
            backgroundColor: urgent ? colors.warningSubtle : colors.secondary,
          }}
        >
          <Text
            variant="label"
            style={{ color: urgent ? colors.warning : colors.mutedForeground, fontWeight: '700' }}
          >
            {count}
          </Text>
        </View>
      ) : null}
    </View>
  );
}

/** Laid out like a ticket: who it is for, the QR code, a tear line, then the PIN in large spaced digits. */
export function PassTicket({
  pass,
}: {
  pass: Pick<IssuedVisitorPass, 'visitorName' | 'unitLabel' | 'qrDataUrl' | 'pin' | 'expiresAt'>;
}) {
  const { colors, spacing, radius } = useTheme();
  const notch = 18;
  const digits = pass.pin.split('');

  return (
    <View
      style={{
        borderRadius: radius['2xl'],
        borderWidth: 1,
        borderColor: colors.border,
        backgroundColor: colors.background,
        // Clips the outer half of each notch so only the cut-out shows.
        overflow: 'hidden',
      }}
    >
      <View style={{ padding: spacing.xl, alignItems: 'center', gap: spacing.lg }}>
        <View style={{ alignItems: 'center', gap: spacing.xxs }}>
          <Text variant="label" color="mutedForeground" uppercase>
            Visitor pass
          </Text>
          <Text variant="title" center numberOfLines={2}>
            {pass.visitorName}
          </Text>
          <Text variant="callout" color="mutedForeground" center>
            Visiting {pass.unitLabel}
          </Text>
        </View>
        <View
          style={{
            padding: spacing.md,
            borderRadius: radius.lg,
            // Always on white: a QR code needs the contrast in dark mode too.
            backgroundColor: '#fff',
            borderWidth: 1,
            borderColor: colors.border,
          }}
        >
          <Image
            source={{ uri: pass.qrDataUrl }}
            accessibilityLabel={`QR code for ${pass.visitorName}'s pass`}
            style={{ width: 168, height: 168 }}
          />
        </View>
      </View>

      {/* Tear line with a notch cut from each side. */}
      <View style={{ height: notch, justifyContent: 'center' }}>
        <View
          style={{
            marginHorizontal: notch,
            borderTopWidth: 1,
            borderStyle: 'dashed',
            borderColor: colors.border,
          }}
        />
        {(['left', 'right'] as const).map((side) => (
          <View
            key={side}
            style={{
              position: 'absolute',
              ...(side === 'left' ? { left: -notch / 2 } : { right: -notch / 2 }),
              width: notch,
              height: notch,
              borderRadius: notch / 2,
              backgroundColor: colors.card,
              borderWidth: 1,
              borderColor: colors.border,
            }}
          />
        ))}
      </View>

      <View
        style={{
          paddingVertical: spacing.xl,
          paddingHorizontal: spacing.lg,
          alignItems: 'center',
          gap: spacing.md,
        }}
      >
        <Text variant="label" color="mutedForeground" uppercase>
          Gate PIN
        </Text>
        <View
          accessible
          accessibilityLabel={`PIN ${digits.join(' ')}`}
          style={{
            alignSelf: 'stretch',
            flexDirection: 'row',
            justifyContent: 'center',
            gap: spacing.xs,
          }}
        >
          {digits.map((digit, i) => (
            <View
              key={i}
              style={{
                // Shares the row so a long PIN still fits on one line on a small phone.
                flex: 1,
                maxWidth: 48,
                paddingVertical: spacing.sm,
                alignItems: 'center',
                borderRadius: radius.lg,
                borderWidth: 1,
                borderColor: colors.border,
                backgroundColor: colors.card,
              }}
            >
              <Text variant="title" style={{ fontVariant: ['tabular-nums'] }} selectable>
                {digit}
              </Text>
            </View>
          ))}
        </View>
        <Text variant="caption" color="mutedForeground" center>
          Expires {formatDateTime(pass.expiresAt, 'medium')}
        </Text>
      </View>
    </View>
  );
}

/** Equal segments in a track, for picking how long a pass lasts. Small phones get two rows of two. */
export function DurationChoice({
  label,
  options,
  value,
  onChange,
  disabled = false,
}: {
  label: string;
  options: readonly { label: string; hours: number }[];
  value: number;
  onChange: (hours: number) => void;
  disabled?: boolean;
}) {
  const { colors, spacing, radius, shadows } = useTheme();
  const { width } = useWindowDimensions();
  const twoRows = width < 360 && options.length === 4;

  return (
    <View
      accessibilityRole="radiogroup"
      accessibilityLabel={label}
      style={{
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: spacing.xs,
        padding: spacing.xs,
        borderRadius: radius.lg,
        backgroundColor: colors.secondary,
        opacity: disabled ? 0.5 : 1,
      }}
    >
      {options.map((option) => {
        const selected = value === option.hours;
        return (
          <Pressable
            key={option.hours}
            onPress={() => onChange(option.hours)}
            disabled={disabled}
            accessibilityRole="radio"
            accessibilityLabel={option.label}
            accessibilityState={{ selected, checked: selected, disabled }}
            style={({ pressed }) => [
              {
                flexBasis: twoRows ? '48%' : 0,
                flexGrow: 1,
                minHeight: 44,
                alignItems: 'center',
                justifyContent: 'center',
                paddingHorizontal: spacing.xs,
                borderRadius: radius.md,
                backgroundColor: selected ? colors.card : 'transparent',
                opacity: pressed ? 0.7 : 1,
              },
              selected && shadows.xs,
            ]}
          >
            <Text
              variant="callout"
              numberOfLines={1}
              style={{
                fontWeight: selected ? '700' : '500',
                color: selected ? colors.foreground : colors.mutedForeground,
              }}
            >
              {option.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}
