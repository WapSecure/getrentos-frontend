import { View } from 'react-native';
import {
  ArrowDown,
  BadgeCheck,
  Check,
  FileCheck2,
  Landmark,
  Lock,
  MapPin,
  Search,
  ShieldCheck,
  Star,
} from 'lucide-react-native';
import { Card, Text, useTheme } from '@getrentos/ui-native';

/**
 * Onboarding illustrations. Each is a miniature of something the product
 * actually does, composed from design-system tokens — no stock art, no
 * one-off colours.
 */

/* --------------------------- shared building blocks --------------------------- */

function Pill({ label, icon }: { label: string; icon?: React.ReactNode }) {
  const { colors, spacing, radius } = useTheme();
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 5,
        paddingVertical: 5,
        paddingHorizontal: spacing.sm,
        borderRadius: radius.full,
        backgroundColor: colors.successSubtle,
      }}
    >
      {icon}
      <Text variant="caption" style={{ color: colors.success, fontWeight: '700' }}>
        {label}
      </Text>
    </View>
  );
}

/* ------------------------------ 1. discovery ------------------------------ */

export function FindPropertiesScene() {
  const { colors, spacing, radius } = useTheme();

  return (
    <View style={{ flex: 1, gap: spacing.md }}>
      {/* search field */}
      <Card elevated style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
        <Search size={17} color={colors.primary} />
        <Text variant="callout" color="mutedForeground" style={{ flex: 1 }}>
          Lekki Phase 1, Lagos
        </Text>
        <View
          style={{
            paddingVertical: 4,
            paddingHorizontal: spacing.sm,
            borderRadius: radius.full,
            backgroundColor: colors.accent,
          }}
        >
          <Text variant="caption" style={{ color: colors.accentForeground, fontWeight: '700' }}>
            2 bed
          </Text>
        </View>
      </Card>

      {/* results */}
      {[
        { title: '2-Bed Apartment · Lekki', price: '₦2,400,000', period: '/ year' },
        { title: 'Studio Flat · Ikate', price: '₦1,850,000', period: '/ year' },
        { title: '3-Bed Terrace · Ikoyi', price: '₦5,200,000', period: '/ year' },
      ].map((row, i) => (
        <Card key={row.price} elevated padding="none" style={{ overflow: 'hidden' }}>
          <View style={{ flexDirection: 'row' }}>
            <View
              style={{
                width: 74,
                height: 74,
                backgroundColor: i === 0 ? colors.accent : colors.secondary,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <MapPin size={19} color={i === 0 ? colors.primary : colors.mutedForeground} />
            </View>
            <View
              style={{ flex: 1, justifyContent: 'center', gap: 4, paddingHorizontal: spacing.md }}
            >
              <Text variant="bodyStrong" numberOfLines={1}>
                {row.title}
              </Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
                <Text variant="callout" color="mutedForeground">
                  {row.price} {row.period}
                </Text>
              </View>
              <View style={{ flexDirection: 'row' }}>
                <Pill label="Verified" icon={<Check size={11} color={colors.success} />} />
              </View>
            </View>
          </View>
        </Card>
      ))}

      {/* map strip — takes whatever height is left so the panel always fills */}
      <View
        style={{
          flex: 1,
          minHeight: 84,
          borderRadius: radius.lg,
          backgroundColor: colors.accent,
          overflow: 'hidden',
          justifyContent: 'flex-end',
          padding: spacing.md,
        }}
      >
        {PIN_SPOTS.map((spot, i) => (
          <View key={i} style={{ position: 'absolute', left: spot.left, top: spot.top }}>
            <MapPin size={spot.size} color={colors.primary} opacity={spot.opacity} />
          </View>
        ))}
        <Text variant="caption" style={{ color: colors.accentForeground, fontWeight: '700' }}>
          128 verified homes nearby
        </Text>
      </View>
    </View>
  );
}

/** Scattered pin positions for the map strip — fixed so the layout never jitters. */
const PIN_SPOTS = [
  { left: '16%' as const, top: '12%' as const, size: 17, opacity: 0.85 },
  { left: '62%' as const, top: '8%' as const, size: 19, opacity: 0.9 },
  { left: '38%' as const, top: '30%' as const, size: 13, opacity: 0.55 },
  { left: '80%' as const, top: '26%' as const, size: 12, opacity: 0.5 },
  { left: '24%' as const, top: '52%' as const, size: 15, opacity: 0.65 },
  { left: '70%' as const, top: '58%' as const, size: 12, opacity: 0.45 },
  { left: '48%' as const, top: '72%' as const, size: 14, opacity: 0.4 },
];

/* -------------------------------- 2. escrow -------------------------------- */

function EscrowNode({
  icon,
  label,
  caption,
  emphasis,
}: {
  icon: React.ReactNode;
  label: string;
  caption: string;
  emphasis?: boolean;
}) {
  const { colors, spacing, radius } = useTheme();
  return (
    <Card
      elevated
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.md,
        ...(emphasis ? { borderWidth: 1.5, borderColor: colors.primary } : {}),
      }}
    >
      <View
        style={{
          width: 40,
          height: 40,
          borderRadius: radius.md,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: emphasis ? colors.primary : colors.secondary,
        }}
      >
        {icon}
      </View>
      <View style={{ flex: 1 }}>
        <Text variant="bodyStrong">{label}</Text>
        <Text variant="caption" color="mutedForeground">
          {caption}
        </Text>
      </View>
      {emphasis ? <Lock size={15} color={colors.primary} /> : null}
    </Card>
  );
}

/** A connector that stretches, so the escrow nodes spread over any panel height. */
function Connector() {
  const { colors } = useTheme();
  return (
    <View
      style={{
        flex: 1,
        minHeight: 26,
        maxHeight: 64,
        alignItems: 'center',
        justifyContent: 'center',
        gap: 3,
      }}
    >
      <View style={{ flex: 1, width: 2, borderRadius: 1, backgroundColor: colors.border }} />
      <ArrowDown size={15} color={colors.mutedForeground} />
      <View style={{ flex: 1, width: 2, borderRadius: 1, backgroundColor: colors.border }} />
    </View>
  );
}

export function EscrowScene() {
  const { colors, spacing, radius } = useTheme();

  return (
    <View style={{ flex: 1 }}>
      <EscrowNode
        icon={
          <Text variant="bodyStrong" style={{ color: colors.mutedForeground }}>
            ₦
          </Text>
        }
        label="You pay"
        caption="₦2,400,000 · card or transfer"
      />

      <Connector />

      <EscrowNode
        icon={<ShieldCheck size={19} color={colors.primaryForeground} />}
        label="Held in escrow"
        caption="Neither side can touch it"
        emphasis
      />

      <Connector />

      <EscrowNode
        icon={<Landmark size={19} color={colors.mutedForeground} />}
        label="Landlord is paid"
        caption="Released once you both confirm"
      />

      {/* takes the remaining height so the panel always fills */}
      <View
        style={{
          flex: 1,
          minHeight: 76,
          marginTop: spacing.md,
          marginBottom: spacing.md,
          borderRadius: radius.lg,
          backgroundColor: colors.accent,
          alignItems: 'center',
          justifyContent: 'center',
          gap: 6,
          padding: spacing.md,
        }}
      >
        <Lock size={18} color={colors.primary} />
        <Text variant="caption" style={{ color: colors.accentForeground, fontWeight: '700' }}>
          ₦2,400,000 protected end to end
        </Text>
        <Text variant="caption" color="mutedForeground">
          Refunded in full if the deal falls through
        </Text>
      </View>
    </View>
  );
}

/* ------------------------------ 3. verification ------------------------------ */

export function VerifiedPeopleScene() {
  const { colors, spacing, radius } = useTheme();

  const CHECKS = [
    { icon: BadgeCheck, label: 'Identity verified', caption: 'NIN / BVN matched' },
    { icon: FileCheck2, label: 'Ownership confirmed', caption: 'Title deed or C of O' },
    { icon: ShieldCheck, label: 'Licence checked', caption: 'Agents and realtors' },
  ];

  return (
    <View style={{ flex: 1, gap: spacing.md, paddingBottom: spacing.md }}>
      {/* trust summary */}
      <Card elevated style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md }}>
        <View
          style={{
            width: 46,
            height: 46,
            borderRadius: radius.full,
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: colors.accent,
          }}
        >
          <Text variant="bodyStrong" style={{ color: colors.accentForeground }}>
            NA
          </Text>
        </View>
        <View style={{ flex: 1, gap: 3 }}>
          <Text variant="bodyStrong">Ngozi Adeyemi</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
            <Star size={12} color={colors.warning} fill={colors.warning} />
            <Text variant="caption" color="mutedForeground">
              Trust score 92 · 14 reviews
            </Text>
          </View>
        </View>
        <Pill label="Verified" icon={<Check size={11} color={colors.success} />} />
      </Card>

      {CHECKS.map(({ icon: Icon, label, caption }) => (
        <Card
          key={label}
          elevated
          style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md }}
        >
          <View
            style={{
              width: 34,
              height: 34,
              borderRadius: radius.full,
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: colors.successSubtle,
            }}
          >
            <Icon size={17} color={colors.success} />
          </View>
          <View style={{ flex: 1 }}>
            <Text variant="bodyStrong">{label}</Text>
            <Text variant="caption" color="mutedForeground">
              {caption}
            </Text>
          </View>
          <Check size={17} color={colors.success} />
        </Card>
      ))}

      {/* takes the remaining height so the panel always fills */}
      <View
        style={{
          flex: 1,
          minHeight: 76,
          borderRadius: radius.lg,
          backgroundColor: colors.successSubtle,
          alignItems: 'center',
          justifyContent: 'center',
          gap: 6,
          padding: spacing.md,
        }}
      >
        <ShieldCheck size={18} color={colors.success} />
        <Text variant="caption" style={{ color: colors.success, fontWeight: '700' }}>
          All three checks cleared before listing
        </Text>
        <Text variant="caption" color="mutedForeground" center>
          Anyone who fails a check never reaches the marketplace
        </Text>
      </View>
    </View>
  );
}
