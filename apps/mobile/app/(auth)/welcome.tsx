import { Platform, Pressable, StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
  FadeInDown,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useSharedValue,
} from 'react-native-reanimated';
import {
  ShieldCheck,
  FileCheck2,
  Lock,
  Eye,
  HandCoins,
  Heart,
  Star,
  ArrowRight,
  BadgeCheck,
} from 'lucide-react-native';
import { Button, Card, Text, ThemeToggle, useTheme } from '@getrentos/ui-native';

const AScrollView = Animated.ScrollView;

/* ----------------------------- content ---------------------------------- */

const TRUST_CHIPS = [
  { icon: ShieldCheck, label: 'BVN + NIN identity' },
  { icon: Lock, label: 'Bank-grade escrow' },
  { icon: FileCheck2, label: 'Title-deed verified' },
  { icon: Eye, label: 'AML monitoring' },
];

const STATS = [
  { value: '50k+', label: 'Members' },
  { value: '$500M+', label: 'Moved safely' },
  { value: '150+', label: 'Cities' },
  { value: '99.9%', label: 'Secure' },
];

const FEATURES = [
  {
    icon: ShieldCheck,
    title: 'Every listing verified',
    body: 'Identity, ownership and licences are checked before anything reaches you.',
  },
  {
    icon: FileCheck2,
    title: 'Apply and sign in minutes',
    body: 'Digital applications, references and e-signatures — no paperwork, no queues.',
  },
  {
    icon: HandCoins,
    title: 'Money held in escrow',
    body: 'Rent and deposits release only when both sides are clear.',
  },
];

const STEPS = [
  { n: '01', title: 'Verify once', body: 'Confirm your identity a single time.' },
  { n: '02', title: 'Match', body: 'Find verified homes, or vetted tenants and buyers.' },
  { n: '03', title: 'Move', body: 'Sign digitally and pay through protected escrow.' },
];

const ROLES = ['Renter', 'Landlord', 'Owner', 'Buyer', 'Realtor', 'Agent'];

/* ------------------------------ screen --------------------------------- */

export default function Welcome() {
  const { colors, spacing, radius, scheme } = useTheme();
  const insets = useSafeAreaInsets();
  const scrollY = useSharedValue(0);

  const onScroll = useAnimatedScrollHandler((e) => {
    scrollY.value = e.contentOffset.y;
  });

  const glowStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: scrollY.value * -0.15 }, { scale: 1 + scrollY.value * 0.0004 }],
    opacity: Math.max(0, 1 - scrollY.value / 420),
  }));

  const footerPad = insets.bottom + 96;

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      {/* ambient glow, parallaxed */}
      <Animated.View
        pointerEvents="none"
        style={[StyleSheet.absoluteFill, { alignItems: 'center' }, glowStyle]}
      >
        <LinearGradient
          colors={[colors.primary, 'transparent']}
          style={{
            position: 'absolute',
            top: -140,
            width: 520,
            height: 520,
            borderRadius: 260,
            opacity: 0.16,
          }}
        />
        <LinearGradient
          colors={[colors.purple, 'transparent']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{
            position: 'absolute',
            top: 60,
            right: -120,
            width: 320,
            height: 320,
            borderRadius: 160,
            opacity: 0.1,
          }}
        />
      </Animated.View>

      {/* header */}
      <View
        style={{
          paddingTop: insets.top + 8,
          paddingHorizontal: spacing.xl,
          paddingBottom: spacing.sm,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 7 }}>
          <View
            style={{
              width: 26,
              height: 26,
              borderRadius: 8,
              backgroundColor: colors.primary,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <BadgeCheck size={16} color={colors.primaryForeground} />
          </View>
          <Text variant="subheading" style={{ fontWeight: '800' }}>
            GetRentos
          </Text>
        </View>
        <ThemeToggle />
      </View>

      <AScrollView
        onScroll={onScroll}
        scrollEventThrottle={16}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: footerPad }}
      >
        {/* hero */}
        <Animated.View
          entering={FadeInDown.duration(500)}
          style={{ paddingHorizontal: spacing.xl, paddingTop: spacing.lg }}
        >
          <Text variant="label" color="primary" uppercase>
            Trust-driven property OS
          </Text>
          <Text
            variant="display"
            style={{ fontSize: 38, lineHeight: 42, marginTop: spacing.sm, letterSpacing: -0.8 }}
          >
            The safer way to rent, buy and manage property.
          </Text>
          <Text variant="body" color="mutedForeground" style={{ marginTop: spacing.md }}>
            One trusted workspace for renters, landlords, owners, buyers, realtors and agents — from
            first search to final signature.
          </Text>
        </Animated.View>

        {/* hero visual — a composed verified-listing card */}
        <Animated.View
          entering={FadeInDown.duration(500).delay(80)}
          style={{ paddingHorizontal: spacing.xl, marginTop: spacing.xl }}
        >
          <Card elevated padding="none">
            <View style={{ height: 148 }}>
              <LinearGradient
                colors={[colors.primary, colors.primaryHover]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={StyleSheet.absoluteFill}
              />
              <View style={styles.heroCardTop}>
                <View style={[styles.pill, { backgroundColor: 'rgba(255,255,255,0.22)' }]}>
                  <ShieldCheck size={13} color="#fff" />
                  <Text variant="caption" style={{ color: '#fff', fontWeight: '700' }}>
                    Verified
                  </Text>
                </View>
                <View style={styles.heartBtn}>
                  <Heart size={15} color="#fff" />
                </View>
              </View>
            </View>

            <View style={{ padding: spacing.lg, gap: spacing.sm }}>
              <View
                style={{
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                }}
              >
                <View style={{ flex: 1, gap: 2 }}>
                  <Text variant="bodyStrong">2-Bed Apartment · Lekki</Text>
                  <Text variant="callout" color="mutedForeground">
                    ₦2,400,000 / year
                  </Text>
                </View>
                <View
                  style={{
                    width: 42,
                    height: 42,
                    borderRadius: 21,
                    borderWidth: 2,
                    borderColor: colors.success,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Text variant="caption" style={{ color: colors.success, fontWeight: '800' }}>
                    92
                  </Text>
                </View>
              </View>
              <View style={{ flexDirection: 'row', gap: 6, flexWrap: 'wrap' }}>
                {['ID checked', 'Escrow', 'Title verified'].map((t) => (
                  <View key={t} style={[styles.pill, { backgroundColor: colors.secondary }]}>
                    <Text variant="caption" color="mutedForeground">
                      {t}
                    </Text>
                  </View>
                ))}
              </View>
            </View>
          </Card>
        </Animated.View>

        {/* trust chips */}
        <Animated.View
          entering={FadeInDown.duration(500).delay(140)}
          style={{
            flexDirection: 'row',
            flexWrap: 'wrap',
            gap: 8,
            paddingHorizontal: spacing.xl,
            marginTop: spacing.xl,
          }}
        >
          {TRUST_CHIPS.map(({ icon: Icon, label }) => (
            <View
              key={label}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 6,
                paddingVertical: 8,
                paddingHorizontal: 12,
                borderRadius: radius.full,
                borderWidth: 1,
                borderColor: colors.border,
                backgroundColor: colors.card,
              }}
            >
              <Icon size={14} color={colors.primary} />
              <Text variant="caption" style={{ fontWeight: '600' }}>
                {label}
              </Text>
            </View>
          ))}
        </Animated.View>

        {/* stats */}
        <Animated.View
          entering={FadeInDown.duration(500).delay(200)}
          style={{ paddingHorizontal: spacing.xl, marginTop: spacing.xl }}
        >
          <Card elevated>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
              {STATS.map((s, i) => (
                <View
                  key={s.label}
                  style={{
                    width: '50%',
                    paddingVertical: spacing.md,
                    paddingHorizontal: spacing.xs,
                    borderTopWidth: i > 1 ? StyleSheet.hairlineWidth : 0,
                    borderColor: colors.border,
                  }}
                >
                  <Text variant="title" style={{ fontSize: 24, lineHeight: 28 }}>
                    {s.value}
                  </Text>
                  <Text variant="caption" color="mutedForeground" style={{ marginTop: 2 }}>
                    {s.label}
                  </Text>
                </View>
              ))}
            </View>
          </Card>
        </Animated.View>

        {/* features */}
        <Section title="Built for trust at every step" delay={260} spacing={spacing}>
          <Card elevated padding="none">
            {FEATURES.map(({ icon: Icon, title, body }, i) => (
              <View key={title}>
                {i > 0 ? (
                  <View
                    style={{
                      height: StyleSheet.hairlineWidth,
                      backgroundColor: colors.border,
                      marginLeft: 64,
                    }}
                  />
                ) : null}
                <View style={{ flexDirection: 'row', gap: spacing.md, padding: spacing.lg }}>
                  <View
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: 12,
                      backgroundColor: colors.accent,
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Icon size={20} color={colors.primary} />
                  </View>
                  <View style={{ flex: 1, gap: 3 }}>
                    <Text variant="bodyStrong">{title}</Text>
                    <Text variant="callout" color="mutedForeground">
                      {body}
                    </Text>
                  </View>
                </View>
              </View>
            ))}
          </Card>
        </Section>

        {/* how it works */}
        <Section title="How it works" delay={320} spacing={spacing}>
          <View style={{ gap: spacing.lg }}>
            {STEPS.map((s, i) => (
              <View key={s.n} style={{ flexDirection: 'row', gap: spacing.md }}>
                <View style={{ alignItems: 'center' }}>
                  <View
                    style={{
                      width: 34,
                      height: 34,
                      borderRadius: 17,
                      borderWidth: 1.5,
                      borderColor: colors.primary,
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Text variant="caption" style={{ color: colors.primary, fontWeight: '800' }}>
                      {s.n}
                    </Text>
                  </View>
                  {i < STEPS.length - 1 ? (
                    <View
                      style={{ flex: 1, width: 1.5, backgroundColor: colors.border, marginTop: 4 }}
                    />
                  ) : null}
                </View>
                <View
                  style={{ flex: 1, paddingBottom: i < STEPS.length - 1 ? spacing.xs : 0, gap: 3 }}
                >
                  <Text variant="bodyStrong">{s.title}</Text>
                  <Text variant="callout" color="mutedForeground">
                    {s.body}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        </Section>

        {/* testimonial */}
        <Section delay={380} spacing={spacing}>
          <Card elevated>
            <View style={{ flexDirection: 'row', gap: 3, marginBottom: spacing.sm }}>
              {[0, 1, 2, 3, 4].map((i) => (
                <Star key={i} size={14} color={colors.warning} fill={colors.warning} />
              ))}
            </View>
            <Text variant="subheading" style={{ letterSpacing: -0.2 }}>
              “Found my apartment in 3 days. The verification process is top-notch.”
            </Text>
            <Text variant="caption" color="mutedForeground" style={{ marginTop: spacing.sm }}>
              Michael Adeyemi · Renter, Lagos
            </Text>
          </Card>
        </Section>

        {/* roles */}
        <Section title="One account, every role" delay={440} spacing={spacing}>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
            {ROLES.map((r) => (
              <View
                key={r}
                style={{
                  paddingVertical: 9,
                  paddingHorizontal: 14,
                  borderRadius: radius.full,
                  backgroundColor: colors.secondary,
                }}
              >
                <Text variant="callout" style={{ fontWeight: '600' }}>
                  {r}
                </Text>
              </View>
            ))}
          </View>
          <Text variant="caption" color="mutedForeground" style={{ marginTop: spacing.md }}>
            Add more roles later — each unlocks with its own quick checks.
          </Text>
        </Section>
      </AScrollView>

      {/* sticky footer CTA */}
      <BlurView
        intensity={Platform.OS === 'ios' ? 40 : 0}
        tint={scheme === 'dark' ? 'dark' : 'light'}
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          bottom: 0,
          paddingHorizontal: spacing.xl,
          paddingTop: spacing.md,
          paddingBottom: insets.bottom + spacing.sm,
          borderTopWidth: StyleSheet.hairlineWidth,
          borderColor: colors.border,
          backgroundColor: Platform.OS === 'ios' ? 'transparent' : colors.background,
          gap: spacing.sm,
        }}
      >
        <Button
          label="Create your account"
          iconRight={<ArrowRight size={17} color={colors.primaryForeground} />}
          onPress={() => router.push('/(auth)/sign-up')}
        />
        <Pressable
          onPress={() => router.push('/(auth)/sign-in')}
          style={{ alignItems: 'center', paddingVertical: 6 }}
          accessibilityRole="button"
        >
          <Text variant="callout" style={{ color: colors.primary, fontWeight: '700' }}>
            I already have an account
          </Text>
        </Pressable>
      </BlurView>
    </View>
  );
}

/* ---------------------------- sub-components --------------------------- */

function Section({
  title,
  delay,
  spacing,
  children,
}: {
  title?: string;
  delay: number;
  spacing: ReturnType<typeof useTheme>['spacing'];
  children: React.ReactNode;
}) {
  return (
    <Animated.View
      entering={FadeInDown.duration(500).delay(delay)}
      style={{ paddingHorizontal: spacing.xl, marginTop: spacing['3xl'] }}
    >
      {title ? (
        <Text variant="heading" style={{ marginBottom: spacing.md }}>
          {title}
        </Text>
      ) : null}
      {children}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  heroCardTop: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: 12,
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 999,
  },
  heartBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: 'rgba(255,255,255,0.22)',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
