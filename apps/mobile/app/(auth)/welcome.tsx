import { Platform, Pressable, StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { ShieldCheck, FileCheck2, HandCoins, ArrowRight, MapPin, Check } from 'lucide-react-native';
import { BrandLogo, Button, Card, Text, ThemeToggle, useTheme } from '@getrentos/ui-native';

/* ----------------------------- content ---------------------------------- */

const VALUES = [
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

/* ------------------------------ screen --------------------------------- */

export default function Welcome() {
  const { colors, spacing, radius, scheme } = useTheme();
  const insets = useSafeAreaInsets();
  const footerPad = insets.bottom + 96;

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
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
        <BrandLogo size={24} />
        <ThemeToggle />
      </View>

      <Animated.ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: footerPad }}
      >
        {/* hero */}
        <Animated.View
          entering={FadeInDown.duration(460)}
          style={{ paddingHorizontal: spacing.xl, paddingTop: spacing['2xl'] }}
        >
          <Text variant="label" color="primary" uppercase>
            Trust-driven property platform
          </Text>
          <Text
            variant="display"
            style={{ fontSize: 36, lineHeight: 41, marginTop: spacing.md, letterSpacing: -0.8 }}
          >
            The safer way to rent, buy and manage property.
          </Text>
          <Text variant="body" color="mutedForeground" style={{ marginTop: spacing.md }}>
            One trusted workspace for renters, landlords, owners, buyers, realtors and agents — from
            first search to final signature.
          </Text>
        </Animated.View>

        {/* hero visual — a single, calm verified-listing card */}
        <Animated.View
          entering={FadeInDown.duration(460).delay(90)}
          style={{ paddingHorizontal: spacing.xl, marginTop: spacing['2xl'] }}
        >
          <Card elevated padding="none">
            <View style={{ height: 176, overflow: 'hidden' }}>
              <LinearGradient
                colors={['#1f74e6', '#0a4fb0']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={StyleSheet.absoluteFill}
              />
              {/* bottom scrim for legibility */}
              <LinearGradient
                colors={['rgba(6,32,72,0)', 'rgba(6,32,72,0.5)']}
                style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: 88 }}
              />
              <View style={styles.heroTop}>
                <View style={styles.pill}>
                  <ShieldCheck size={13} color="#fff" />
                  <Text variant="caption" style={{ color: '#fff', fontWeight: '700' }}>
                    Verified listing
                  </Text>
                </View>
              </View>
              <View style={styles.heroLoc}>
                <MapPin size={12} color="rgba(255,255,255,0.9)" />
                <Text variant="caption" style={{ color: '#fff', fontWeight: '600' }}>
                  Lekki Phase 1, Lagos
                </Text>
              </View>
            </View>

            <View style={{ padding: spacing.lg, gap: 6 }}>
              <Text variant="bodyStrong">2-Bed Apartment · Lekki</Text>
              <Text variant="callout" color="mutedForeground">
                ₦2,400,000 / year
              </Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 }}>
                <Check size={14} color={colors.success} />
                <Text variant="caption" color="mutedForeground">
                  Identity, ownership &amp; escrow checked
                </Text>
              </View>
            </View>
          </Card>
        </Animated.View>

        {/* values */}
        <Animated.View
          entering={FadeInDown.duration(460).delay(170)}
          style={{
            paddingHorizontal: spacing.xl,
            marginTop: spacing['4xl'],
            gap: spacing['2xl'],
          }}
        >
          {VALUES.map(({ icon: Icon, title, body }) => (
            <View key={title} style={{ flexDirection: 'row', gap: spacing.md }}>
              <View
                style={{
                  width: 38,
                  height: 38,
                  borderRadius: radius.md,
                  backgroundColor: colors.accent,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Icon size={19} color={colors.primary} />
              </View>
              <View style={{ flex: 1, gap: 3 }}>
                <Text variant="bodyStrong">{title}</Text>
                <Text variant="callout" color="mutedForeground">
                  {body}
                </Text>
              </View>
            </View>
          ))}
        </Animated.View>
      </Animated.ScrollView>

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

/* ------------------------------ styles -------------------------------- */

const styles = StyleSheet.create({
  heroTop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    padding: 12,
  },
  heroLoc: {
    position: 'absolute',
    left: 14,
    bottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.22)',
  },
});
