import { Pressable, View } from 'react-native';
import { router } from 'expo-router';
import { Image } from 'expo-image';
import { BadgeCheck, ChevronRight, Home, Minus, Plus, Sparkles, Star } from 'lucide-react-native';
import { Button, Card, Price, Text, useTheme } from '@getrentos/ui-native';
import { ApiError } from '@/lib/api/client';
import {
  relativeDay,
  stayRange,
  type HostBooking,
  type HostListing,
} from '@/lib/api/hostShortlets';
import type { ShortletBookingStatus } from '@/lib/api/shortlets';
import { haptics } from '@/lib/haptics';

/* ------------------------------- status pill ------------------------------ */

export type Tone = 'success' | 'warning' | 'info' | 'neutral' | 'danger';

export const BOOKING_STATUS: Record<ShortletBookingStatus, { label: string; tone: Tone }> = {
  REQUESTED: { label: 'Needs reply', tone: 'warning' },
  CONFIRMED: { label: 'Confirmed', tone: 'success' },
  DECLINED: { label: 'Declined', tone: 'neutral' },
  CANCELLED: { label: 'Cancelled', tone: 'neutral' },
  COMPLETED: { label: 'Completed', tone: 'info' },
};

export function listingStatus(status: string): { label: string; tone: Tone } {
  switch (status) {
    case 'PUBLISHED':
      return { label: 'Live', tone: 'success' };
    case 'PAUSED':
      return { label: 'Paused', tone: 'warning' };
    case 'PENDING_VERIFICATION':
      return { label: 'In review', tone: 'info' };
    case 'CLOSED':
      return { label: 'Closed', tone: 'neutral' };
    default:
      return { label: status.toLowerCase(), tone: 'neutral' };
  }
}

/** A dot plus a word: status at a glance without a heavy badge. */
export function StatusPill({ label, tone }: { label: string; tone: Tone }) {
  const { colors, radius } = useTheme();
  const map: Record<Tone, { fg: string; bg: string }> = {
    success: { fg: colors.success, bg: colors.successSubtle },
    warning: { fg: colors.warning, bg: colors.warningSubtle },
    info: { fg: colors.primary, bg: colors.infoSubtle },
    danger: { fg: colors.destructive, bg: colors.destructiveSubtle },
    neutral: { fg: colors.mutedForeground, bg: colors.secondary },
  };
  const c = map[tone];
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: radius.full,
        backgroundColor: c.bg,
        alignSelf: 'flex-start',
      }}
    >
      <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: c.fg }} />
      <Text variant="caption" style={{ color: c.fg, fontWeight: '700' }}>
        {label}
      </Text>
    </View>
  );
}

/* -------------------------------- thumbnail ------------------------------- */

export function Thumb({ uri, size = 64 }: { uri?: string; size?: number }) {
  const { colors, radius } = useTheme();
  return uri ? (
    <Image
      source={{ uri }}
      recyclingKey={uri}
      cachePolicy="memory-disk"
      transition={150}
      contentFit="cover"
      style={{
        width: size,
        height: size,
        borderRadius: radius.md,
        backgroundColor: colors.secondary,
      }}
      accessibilityIgnoresInvertColors
    />
  ) : (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: radius.md,
        backgroundColor: colors.secondary,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Home size={size / 3} color={colors.mutedForeground} />
    </View>
  );
}

/* -------------------------------- stay card ------------------------------- */

/**
 * One stay: who, when, how long and what the host takes home. The guest's
 * track record is summarised in one line, so a request can be judged at a
 * glance before opening it.
 */
export function StayCard({ b, compact }: { b: HostBooking; compact?: boolean }) {
  const { colors, spacing } = useTheme();
  const s = BOOKING_STATUS[b.status];
  const g = b.guestSummary;
  const when = b.status === 'CONFIRMED' || b.status === 'REQUESTED' ? relativeDay(b.checkIn) : null;
  const earns = b.hostNet ?? b.total;
  return (
    <Pressable
      onPress={() => {
        void haptics.tap();
        router.push({ pathname: '/(app)/host/booking/[id]', params: { id: b.id } });
      }}
      accessibilityRole="button"
      accessibilityLabel={`${b.guestName ?? 'Guest'}, ${b.propertyTitle}, ${stayRange(b.checkIn, b.checkOut)}, ${b.nights} nights, ${s.label}`}
    >
      {({ pressed }) => (
        <Card elevated style={{ gap: spacing.md, opacity: pressed ? 0.92 : 1 }}>
          <View style={{ flexDirection: 'row', gap: spacing.md }}>
            <Thumb uri={b.coverImageUrl} size={compact ? 52 : 64} />
            <View style={{ flex: 1, gap: 3 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Text variant="bodyStrong" numberOfLines={1} style={{ flexShrink: 1 }}>
                  {b.guestName ?? 'Guest'}
                </Text>
                {g?.identityVerified ? (
                  <BadgeCheck size={15} color={colors.success} accessibilityLabel="ID verified" />
                ) : null}
              </View>
              <Text variant="caption" color="mutedForeground" numberOfLines={1}>
                {b.propertyTitle}
              </Text>
              <Text variant="callout" style={{ fontWeight: '600' }}>
                {stayRange(b.checkIn, b.checkOut)} · {b.nights} night{b.nights === 1 ? '' : 's'} ·{' '}
                {b.guestCount} guest{b.guestCount === 1 ? '' : 's'}
              </Text>
            </View>
            <ChevronRight size={18} color={colors.mutedForeground} style={{ marginTop: 2 }} />
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
            <StatusPill label={s.label} tone={s.tone} />
            {when ? (
              <Text variant="caption" color="mutedForeground">
                {when}
              </Text>
            ) : null}
            <View style={{ flex: 1 }} />
            <View style={{ alignItems: 'flex-end' }}>
              <Price amount={earns} variant="bodyStrong" />
              <Text variant="caption" color="mutedForeground">
                {b.hostNet != null ? 'you earn' : 'total'}
              </Text>
            </View>
          </View>
          {!compact && g && b.status === 'REQUESTED' ? <GuestLine g={g} /> : null}
        </Card>
      )}
    </Pressable>
  );
}

/** The guest at a glance, counted across GetRentos only. */
export function GuestLine({ g }: { g: NonNullable<HostBooking['guestSummary']> }) {
  const { colors, spacing } = useTheme();
  const bits = [
    g.completedStays
      ? `${g.completedStays} stay${g.completedStays === 1 ? '' : 's'}`
      : 'First stay',
    g.ratingCount ? `★ ${g.ratingAverage?.toFixed(1)} (${g.ratingCount})` : null,
    `Joined ${new Date(g.memberSince).getFullYear()}`,
    g.cancellations12m
      ? `${g.cancellations12m} cancellation${g.cancellations12m === 1 ? '' : 's'}`
      : null,
    g.damageClaimsUpheld
      ? `${g.damageClaimsUpheld} damage claim${g.damageClaimsUpheld === 1 ? '' : 's'}`
      : null,
  ].filter(Boolean);
  const flagged = g.cancellations12m > 1 || g.damageClaimsUpheld > 0;
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.xs,
        paddingTop: spacing.sm,
        borderTopWidth: 1,
        borderTopColor: colors.border,
      }}
    >
      <Star size={13} color={flagged ? colors.warning : colors.mutedForeground} />
      <Text
        variant="caption"
        style={{ flex: 1, color: flagged ? colors.warning : colors.mutedForeground }}
        numberOfLines={2}
      >
        {bits.join(' · ')}
      </Text>
    </View>
  );
}

/* ------------------------------- listing row ------------------------------ */

export function ListingRow({ l, onPress }: { l: HostListing; onPress: () => void }) {
  const { colors, spacing } = useTheme();
  const s = listingStatus(l.status);
  return (
    <Pressable
      onPress={() => {
        void haptics.tap();
        onPress();
      }}
      accessibilityRole="button"
      accessibilityLabel={`${l.title}, ${l.city}, ${s.label}`}
    >
      {({ pressed }) => (
        <Card
          elevated
          style={{ flexDirection: 'row', gap: spacing.md, opacity: pressed ? 0.92 : 1 }}
        >
          <Thumb uri={l.coverImageUrl ?? l.images?.[0]} size={76} />
          <View style={{ flex: 1, gap: 4 }}>
            <Text variant="bodyStrong" numberOfLines={1}>
              {l.title}
            </Text>
            <Text variant="caption" color="mutedForeground" numberOfLines={1}>
              {l.city}, {l.state}
              {l.reviewCount ? `  ·  ★ ${l.ratingAverage?.toFixed(1)} (${l.reviewCount})` : ''}
            </Text>
            <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 4 }}>
              {l.nightlyRate != null ? (
                <Price amount={l.nightlyRate} variant="callout" />
              ) : (
                <Text variant="callout" color="mutedForeground">
                  No rate set
                </Text>
              )}
              <Text variant="caption" color="mutedForeground">
                {l.pricingMode === 'PER_NIGHT' ? '/ night' : '/ stay'}
              </Text>
            </View>
            <StatusPill label={s.label} tone={s.tone} />
          </View>
          <ChevronRight size={18} color={colors.mutedForeground} style={{ alignSelf: 'center' }} />
        </Card>
      )}
    </Pressable>
  );
}

/* --------------------------------- stepper -------------------------------- */

/** A +/- control for small whole numbers (guests, nights, percentages). */
export function Stepper({
  label,
  hint,
  value,
  onChange,
  min = 0,
  max = 99,
  step = 1,
  suffix,
}: {
  label: string;
  hint?: string;
  value: number;
  onChange: (v: number) => void;
  min?: number;
  max?: number;
  step?: number;
  suffix?: string;
}) {
  const { colors, spacing, radius } = useTheme();
  const set = (v: number) => {
    const next = Math.min(max, Math.max(min, v));
    if (next !== value) {
      void haptics.tap();
      onChange(next);
    }
  };
  const btn = (disabled: boolean) => ({
    width: 36,
    height: 36,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: disabled ? colors.border : colors.foreground,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    opacity: disabled ? 0.35 : 1,
  });
  return (
    <View
      accessible
      accessibilityRole="adjustable"
      accessibilityLabel={label}
      accessibilityValue={{ text: `${value}${suffix ?? ''}` }}
      accessibilityActions={[{ name: 'increment' }, { name: 'decrement' }]}
      onAccessibilityAction={(e) =>
        set(e.nativeEvent.actionName === 'increment' ? value + step : value - step)
      }
      style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md, minHeight: 52 }}
    >
      <View style={{ flex: 1 }}>
        <Text variant="body">{label}</Text>
        {hint ? (
          <Text variant="caption" color="mutedForeground">
            {hint}
          </Text>
        ) : null}
      </View>
      <Pressable
        onPress={() => set(value - step)}
        disabled={value <= min}
        hitSlop={8}
        style={btn(value <= min)}
        importantForAccessibility="no"
      >
        <Minus size={16} color={colors.foreground} />
      </Pressable>
      <Text variant="bodyStrong" style={{ minWidth: 44, textAlign: 'center' }}>
        {value}
        {suffix ?? ''}
      </Text>
      <Pressable
        onPress={() => set(value + step)}
        disabled={value >= max}
        hitSlop={8}
        style={btn(value >= max)}
        importantForAccessibility="no"
      >
        <Plus size={16} color={colors.foreground} />
      </Pressable>
    </View>
  );
}

/* --------------------------------- Pro gate ------------------------------- */

export const isUpgradeError = (err: unknown) =>
  err instanceof ApiError && (err.status === 402 || err.code === 'PLAN_UPGRADE_REQUIRED');

/** Hosting is Pro: explain the value instead of showing an error. */
export function HostProGate() {
  const { colors, spacing } = useTheme();
  const perks = [
    'List furnished apartments for nightly stays',
    'Instant booking, seasonal pricing and calendar sync with Airbnb',
    'Guests pay upfront; payouts straight to your bank',
    'Deposits, damage claims and dispute support',
  ];
  return (
    <Card elevated style={{ gap: spacing.md }}>
      <View
        style={{
          width: 48,
          height: 48,
          borderRadius: 24,
          backgroundColor: colors.infoSubtle,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Sparkles size={22} color={colors.primary} />
      </View>
      <Text variant="heading">Short-stay hosting is part of Pro</Text>
      {perks.map((p) => (
        <View key={p} style={{ flexDirection: 'row', gap: spacing.sm }}>
          <BadgeCheck size={16} color={colors.success} style={{ marginTop: 2 }} />
          <Text variant="callout" style={{ flex: 1 }}>
            {p}
          </Text>
        </View>
      ))}
      <Button label="See Pro" onPress={() => router.push('/(app)/billing')} />
    </Card>
  );
}
