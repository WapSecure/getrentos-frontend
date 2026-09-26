import { createContext, useContext, useEffect, type ReactNode } from 'react';
import { View, type StyleProp, type ViewStyle } from 'react-native';
import Animated, {
  cancelAnimation,
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
  type SharedValue,
} from 'react-native-reanimated';
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

/* ------------------------------- scroll motion ------------------------------- */

type SceneMotion = {
  /** Distance of this slide from centre, in pages: −1 entering, 0 settled, 1 leaving. */
  offset: SharedValue<number>;
  animate: boolean;
};

const SceneMotionContext = createContext<SceneMotion | null>(null);
export const SceneMotionProvider = SceneMotionContext.Provider;

const LAYER_TRAVEL = 36;

/**
 * A card that travels a little further than the page per unit of `depth`, so a
 * scene's pieces fan out and settle one after another as the finger drags —
 * cheap, UI-thread parallax that tracks the gesture instead of a timer.
 */
function Layer({
  depth,
  children,
  style,
}: {
  depth: number;
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
}) {
  const motion = useContext(SceneMotionContext);
  const offset = motion?.offset;
  const animate = !!motion?.animate;
  const animated = useAnimatedStyle(() => {
    if (!animate || !offset) return {};
    const d = offset.get();
    return {
      opacity: 1 - Math.min(1, Math.abs(d) * (0.35 + depth * 0.18)),
      transform: [{ translateX: -d * depth * LAYER_TRAVEL }],
    };
  });
  return <Animated.View style={[style, animated]}>{children}</Animated.View>;
}

/** A soft ring that breathes around the escrow lock while the intro is open. */
function Pulse({ size, color }: { size: number; color: string }) {
  const motion = useContext(SceneMotionContext);
  const animate = !!motion?.animate;
  const t = useSharedValue(0);

  useEffect(() => {
    if (!animate) return;
    t.set(withRepeat(withTiming(1, { duration: 1800, easing: Easing.out(Easing.quad) }), -1));
    return () => cancelAnimation(t);
  }, [animate, t]);

  const ring = useAnimatedStyle(() => ({
    opacity: 0.45 * (1 - t.get()),
    transform: [{ scale: 1 + t.get() * 0.5 }],
  }));

  if (!animate) return null;
  return (
    <Animated.View
      pointerEvents="none"
      style={[
        {
          position: 'absolute',
          width: size,
          height: size,
          borderRadius: size / 3.2,
          borderWidth: 2,
          borderColor: color,
        },
        ring,
      ]}
    />
  );
}

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
      <Layer depth={0}>
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
      </Layer>

      {/* results */}
      {[
        { title: '2-Bed Apartment · Lekki', price: '₦2,400,000', period: '/ year' },
        { title: 'Studio Flat · Ikate', price: '₦1,850,000', period: '/ year' },
        { title: '3-Bed Terrace · Ikoyi', price: '₦5,200,000', period: '/ year' },
      ].map((row, i) => (
        <Layer key={row.price} depth={i + 1}>
          <Card elevated padding="none" style={{ overflow: 'hidden' }}>
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
        </Layer>
      ))}

      {/* map strip — takes whatever height is left so the panel always fills */}
      <Layer depth={4} style={{ flex: 1, minHeight: 84 }}>
        <View
          style={{
            flex: 1,
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
      </Layer>
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
        {emphasis ? <Pulse size={40} color={colors.primary} /> : null}
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
      <Layer depth={0}>
        <EscrowNode
          icon={
            <Text variant="bodyStrong" style={{ color: colors.mutedForeground }}>
              ₦
            </Text>
          }
          label="You pay"
          caption="₦2,400,000 · card or transfer"
        />
      </Layer>

      <Connector />

      <Layer depth={1}>
        <EscrowNode
          icon={<ShieldCheck size={19} color={colors.primaryForeground} />}
          label="Held in escrow"
          caption="Neither side can touch it"
          emphasis
        />
      </Layer>

      <Connector />

      <Layer depth={2}>
        <EscrowNode
          icon={<Landmark size={19} color={colors.mutedForeground} />}
          label="Landlord is paid"
          caption="Released once you both confirm"
        />
      </Layer>

      {/* takes the remaining height so the panel always fills */}
      <Layer depth={3} style={{ flex: 1, minHeight: 76 }}>
        <View
          style={{
            flex: 1,
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
      </Layer>
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
      <Layer depth={0}>
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
      </Layer>

      {CHECKS.map(({ icon: Icon, label, caption }, i) => (
        <Layer key={label} depth={i + 1}>
          <Card elevated style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md }}>
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
        </Layer>
      ))}

      {/* takes the remaining height so the panel always fills */}
      <Layer depth={4} style={{ flex: 1, minHeight: 76 }}>
        <View
          style={{
            flex: 1,
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
      </Layer>
    </View>
  );
}
