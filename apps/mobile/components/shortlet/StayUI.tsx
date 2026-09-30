import type { ReactNode } from 'react';
import { Linking, Pressable, View } from 'react-native';
import {
  BadgeCheck,
  ClipboardCheck,
  Lock,
  MessageCircle,
  Phone,
  Scale,
  ShieldCheck,
  Zap,
  type LucideIcon,
} from 'lucide-react-native';
import { Card, Divider, Price, Text, useTheme } from '@getrentos/ui-native';
import type { ShortletAvailability, ShortletListing } from '@/lib/api/shortlets';
import {
  GUEST_PROMISE_TEXT,
  PAYMENT_PROTECTION_TEXT,
  quoteLines,
  type PriceLine,
} from '@/lib/stays';
import { SUPPORT, hasSupportLine, telUrl, whatsappUrl } from '@/lib/support';
import { haptics } from '@/lib/haptics';

/* -------------------------------- trust chip ------------------------------ */

type ChipTone = 'success' | 'info' | 'purple' | 'neutral' | 'onImage';

/** A small, quiet signal of trust: an icon and a word, never a shouty badge. */
export function TrustChip({
  icon: Icon,
  label,
  tone = 'neutral',
}: {
  icon: LucideIcon;
  label: string;
  tone?: ChipTone;
}) {
  const { colors, radius } = useTheme();
  const map: Record<ChipTone, { fg: string; bg: string }> = {
    success: { fg: colors.success, bg: colors.successSubtle },
    info: { fg: colors.primary, bg: colors.infoSubtle },
    purple: { fg: colors.purple, bg: colors.purpleSubtle },
    neutral: { fg: colors.foreground, bg: colors.secondary },
    onImage: { fg: '#161b22', bg: 'rgba(255,255,255,0.92)' },
  };
  const c = map[tone];
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 5,
        paddingHorizontal: 9,
        paddingVertical: 4,
        borderRadius: radius.full,
        backgroundColor: c.bg,
        alignSelf: 'flex-start',
      }}
    >
      <Icon size={12} color={c.fg} strokeWidth={2.4} />
      <Text variant="caption" style={{ color: c.fg, fontWeight: '700' }}>
        {label}
      </Text>
    </View>
  );
}

/** The trust signals a stay has earned, in a fixed order. */
export function TrustChips({
  listing,
  onImage,
}: {
  listing: Pick<ShortletListing, 'inspection' | 'fairPrice' | 'hostVerified' | 'instantBooking'>;
  onImage?: boolean;
}) {
  const chips: ReactNode[] = [];
  if (listing.inspection)
    chips.push(
      <TrustChip
        key="i"
        icon={ClipboardCheck}
        label="Inspected"
        tone={onImage ? 'onImage' : 'purple'}
      />
    );
  if (listing.fairPrice)
    chips.push(
      <TrustChip key="f" icon={Scale} label="Fair price" tone={onImage ? 'onImage' : 'success'} />
    );
  if (!onImage && listing.hostVerified)
    chips.push(<TrustChip key="v" icon={BadgeCheck} label="Verified host" tone="info" />);
  if (!onImage && listing.instantBooking)
    chips.push(<TrustChip key="b" icon={Zap} label="Instant book" tone="neutral" />);
  if (!chips.length) return null;
  return <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>{chips}</View>;
}

/* --------------------------------- section -------------------------------- */

/** A titled block on a long page, with room to breathe above it. */
export function Section({
  title,
  caption,
  children,
  accessory,
}: {
  title: string;
  caption?: string;
  children: ReactNode;
  accessory?: ReactNode;
}) {
  const { spacing } = useTheme();
  return (
    <View style={{ gap: spacing.md }}>
      <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: spacing.sm }}>
        <View style={{ flex: 1, gap: 2 }}>
          <Text variant="heading" accessibilityRole="header">
            {title}
          </Text>
          {caption ? (
            <Text variant="callout" color="mutedForeground">
              {caption}
            </Text>
          ) : null}
        </View>
        {accessory}
      </View>
      {children}
    </View>
  );
}

/** Icon, a strong line and a quiet one: the unit of every fact list. */
export function InfoRow({
  icon: Icon,
  title,
  detail,
  muted,
  trailing,
}: {
  icon: LucideIcon;
  title: string;
  detail?: string | null;
  muted?: boolean;
  trailing?: ReactNode;
}) {
  const { colors, spacing, radius } = useTheme();
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md }}>
      <View
        style={{
          width: 38,
          height: 38,
          borderRadius: radius.md,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: colors.secondary,
        }}
      >
        <Icon size={18} color={muted ? colors.mutedForeground : colors.foreground} />
      </View>
      <View style={{ flex: 1, gap: 1 }}>
        <Text variant="bodyStrong" color={muted ? 'mutedForeground' : 'foreground'}>
          {title}
        </Text>
        {detail ? (
          <Text variant="callout" color="mutedForeground">
            {detail}
          </Text>
        ) : null}
      </View>
      {trailing}
    </View>
  );
}

/* ----------------------------- price breakdown ---------------------------- */

function Line({ line }: { line: PriceLine }) {
  const { colors } = useTheme();
  return (
    <View style={{ gap: 2 }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 12 }}>
        <Text variant="body" color="mutedForeground" style={{ flex: 1 }}>
          {line.label}
        </Text>
        <Text
          variant="body"
          style={{
            color: line.credit ? colors.success : colors.foreground,
            fontVariant: ['tabular-nums'],
          }}
        >
          {line.credit ? '−' : ''}₦{line.amount.toLocaleString('en-NG')}
        </Text>
      </View>
      {line.note ? (
        <Text variant="caption" color="mutedForeground">
          {line.note}
        </Text>
      ) : null}
    </View>
  );
}

/**
 * What the guest pays, line by line, then the total and: apart from it: the
 * refundable deposit. Ends with where the money waits.
 */
export function PriceBreakdown({
  quote,
  deposit,
}: {
  quote: ShortletAvailability;
  deposit?: number;
}) {
  const { colors, spacing } = useTheme();
  return (
    <View style={{ gap: spacing.sm }}>
      {quoteLines(quote).map((l) => (
        <Line key={l.label} line={l} />
      ))}
      <Divider style={{ marginVertical: spacing.xs }} />
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <Text variant="subheading">Total</Text>
        <Price amount={quote.estimatedTotal ?? 0} variant="subheading" />
      </View>
      {deposit ? (
        <Text variant="callout" color="mutedForeground">
          Plus a ₦{deposit.toLocaleString('en-NG')} refundable deposit, returned after checkout.
        </Text>
      ) : null}
      <View style={{ flexDirection: 'row', gap: spacing.sm, marginTop: spacing.xs }}>
        <Lock size={14} color={colors.success} style={{ marginTop: 2 }} />
        <Text variant="caption" color="mutedForeground" style={{ flex: 1 }}>
          GetRentos Payment Protection. {PAYMENT_PROTECTION_TEXT}
        </Text>
      </View>
    </View>
  );
}

/* ------------------------------ guest promise ----------------------------- */

/** The promise, stated plainly, with the protection that backs it. */
export function GuestPromiseCard({ children }: { children?: ReactNode }) {
  const { colors, spacing, radius } = useTheme();
  return (
    <Card
      style={{
        gap: spacing.md,
        backgroundColor: colors.successSubtle,
        borderColor: 'transparent',
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
        <View
          style={{
            width: 34,
            height: 34,
            borderRadius: radius.full,
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: colors.card,
          }}
        >
          <ShieldCheck size={18} color={colors.success} />
        </View>
        <Text variant="subheading" style={{ flex: 1 }}>
          GetRentos Guest Promise
        </Text>
      </View>
      <Text variant="callout" style={{ color: colors.foreground }}>
        {GUEST_PROMISE_TEXT}
      </Text>
      {children}
    </Card>
  );
}

/* --------------------------------- support -------------------------------- */

function SupportAction({
  icon: Icon,
  label,
  url,
}: {
  icon: LucideIcon;
  label: string;
  url: string;
}) {
  const { colors, radius } = useTheme();
  return (
    <Pressable
      onPress={() => {
        void haptics.tap();
        void Linking.openURL(url);
      }}
      accessibilityRole="link"
      accessibilityLabel={label}
      style={({ pressed }) => ({
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        minHeight: 44,
        borderRadius: radius.full,
        borderWidth: 1,
        borderColor: colors.border,
        backgroundColor: colors.card,
        opacity: pressed ? 0.8 : 1,
      })}
    >
      <Icon size={16} color={colors.primary} />
      <Text variant="callout" color="primary" style={{ fontWeight: '700' }}>
        {label}
      </Text>
    </Pressable>
  );
}

/**
 * Call or WhatsApp a person at GetRentos. Renders nothing until the support
 * line is configured, so no screen ever shows a placeholder number.
 */
export function SupportContact({ lead, context }: { lead?: string; context?: string }) {
  const { spacing } = useTheme();
  if (!hasSupportLine()) return null;
  return (
    <View style={{ gap: spacing.sm }}>
      <Text variant="callout" color="mutedForeground">
        {lead ?? 'Need a hand? Talk to a person at GetRentos.'}
      </Text>
      <View style={{ flexDirection: 'row', gap: spacing.sm }}>
        {SUPPORT.phone ? (
          <SupportAction icon={Phone} label="Call us" url={telUrl(SUPPORT.phone)} />
        ) : null}
        {SUPPORT.whatsapp ? (
          <SupportAction
            icon={MessageCircle}
            label="WhatsApp"
            url={whatsappUrl(SUPPORT.whatsapp, context)}
          />
        ) : null}
      </View>
      {SUPPORT.hours ? (
        <Text variant="caption" color="mutedForeground">
          {SUPPORT.hours}
        </Text>
      ) : null}
    </View>
  );
}
