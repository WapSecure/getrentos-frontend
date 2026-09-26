import { Pressable, ScrollView, View } from 'react-native';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import {
  ArrowRight,
  BadgeCheck,
  Building2,
  Search,
  ShieldCheck,
  Sparkles,
} from 'lucide-react-native';
import {
  BrandLogo,
  Button,
  Card,
  Text,
  ThemeToggle,
  useReducedMotion,
  useTheme,
} from '@getrentos/ui-native';
import { resetOnboarding } from '@/lib/onboarding';

export default function Welcome() {
  const { colors, spacing, radius } = useTheme();
  const insets = useSafeAreaInsets();
  const reduceMotion = useReducedMotion();

  const replayIntro = async () => {
    await resetOnboarding();
    router.replace('/(auth)/onboarding');
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <LinearGradient
        colors={[colors.accent, colors.background, colors.background]}
        locations={[0, 0.58, 1]}
        style={{ position: 'absolute', left: 0, right: 0, top: 0, bottom: 0 }}
      />
      <View
        pointerEvents="none"
        style={{
          position: 'absolute',
          width: 240,
          height: 240,
          borderRadius: 120,
          right: -110,
          top: 80,
          backgroundColor: colors.infoSubtle,
          opacity: 0.7,
        }}
      />

      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingTop: insets.top + spacing.md,
          paddingHorizontal: spacing.xl,
        }}
      >
        <BrandLogo size={24} />
        <ThemeToggle variant="pill" compact />
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{
          flexGrow: 1,
          justifyContent: 'center',
          paddingHorizontal: spacing.xl,
          paddingVertical: spacing.lg,
        }}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View entering={reduceMotion ? undefined : FadeInDown.duration(460).delay(60)}>
          <View
            style={{
              alignSelf: 'flex-start',
              flexDirection: 'row',
              alignItems: 'center',
              gap: spacing.xs,
              paddingVertical: 6,
              paddingHorizontal: spacing.sm,
              borderRadius: radius.full,
              backgroundColor: colors.card,
              borderWidth: 1,
              borderColor: colors.border,
              marginBottom: spacing.lg,
            }}
          >
            <Sparkles size={13} color={colors.primary} />
            <Text variant="caption" color="primary" style={{ fontWeight: '700' }}>
              NIGERIA&apos;S TRUSTED PROPERTY OS
            </Text>
          </View>
          <Text
            variant="display"
            accessibilityRole="header"
            style={{ fontSize: 38, lineHeight: 43, letterSpacing: -1.3 }}
          >
            Move with clarity.{`\n`}Live with confidence.
          </Text>
          <Text
            variant="body"
            color="mutedForeground"
            style={{ marginTop: spacing.md, maxWidth: 340 }}
          >
            Verified homes, protected payments, and every property relationship in one beautifully
            simple place.
          </Text>
        </Animated.View>

        <Animated.View
          entering={reduceMotion ? undefined : FadeIn.duration(480).delay(150)}
          style={{ marginTop: spacing.xl }}
        >
          <Card elevated style={{ gap: spacing.md, borderColor: colors.primary, borderWidth: 1 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md }}>
              <View
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: radius.lg,
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: colors.primary,
                }}
              >
                <Building2 size={23} color={colors.primaryForeground} />
              </View>
              <View style={{ flex: 1 }}>
                <Text variant="bodyStrong">A safer way to find home</Text>
                <Text variant="caption" color="mutedForeground">
                  Renting, buying and managing—connected
                </Text>
              </View>
              <BadgeCheck size={21} color={colors.success} />
            </View>
            <View style={{ height: 1, backgroundColor: colors.border }} />
            <View
              style={{
                flexDirection: 'row',
                flexWrap: 'wrap',
                justifyContent: 'space-between',
                rowGap: spacing.sm,
              }}
            >
              <TrustPoint icon={<BadgeCheck size={14} color={colors.success} />} label="Verified" />
              <TrustPoint
                icon={<ShieldCheck size={14} color={colors.primary} />}
                label="Protected"
              />
              <TrustPoint icon={<Sparkles size={14} color={colors.purple} />} label="Effortless" />
            </View>
          </Card>
        </Animated.View>
      </ScrollView>

      <Animated.View
        entering={reduceMotion ? undefined : FadeInDown.duration(460).delay(220)}
        style={{
          paddingHorizontal: spacing.xl,
          paddingBottom: insets.bottom + spacing.lg,
          gap: spacing.sm,
        }}
      >
        <Button
          label="Create your account"
          iconRight={<ArrowRight size={17} color={colors.primaryForeground} />}
          onPress={() => router.push('/(auth)/sign-up')}
        />
        <Button
          label="I already have an account"
          variant="outline"
          onPress={() => router.push('/(auth)/sign-in')}
        />
        <Button
          label="Browse homes without an account"
          variant="ghost"
          icon={<Search size={16} color={colors.primary} />}
          onPress={() => router.push('/(market)')}
        />
        {__DEV__ ? (
          <Pressable
            onPress={replayIntro}
            accessibilityRole="button"
            accessibilityLabel="Replay product introduction"
            style={{ alignItems: 'center', paddingTop: spacing.xs }}
          >
            <Text variant="caption" color="primary" style={{ fontWeight: '600' }}>
              Replay intro (dev)
            </Text>
          </Pressable>
        ) : null}
      </Animated.View>
    </View>
  );
}

function TrustPoint({ icon, label }: { icon: React.ReactNode; label: string }) {
  const { spacing } = useTheme();
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.xs }}>
      {icon}
      <Text variant="caption" style={{ fontWeight: '700' }}>
        {label}
      </Text>
    </View>
  );
}
