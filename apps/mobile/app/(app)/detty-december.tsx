import { useMemo, useState } from 'react';
import { Pressable, View } from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  ChevronLeft,
  ClipboardCheck,
  Lock,
  ReceiptText,
  ShieldCheck,
  type LucideIcon,
} from 'lucide-react-native';
import { Chip, Text, useTheme } from '@getrentos/ui-native';
import { StayResults } from '@/components/shortlet/StayResults';
import { SupportContact } from '@/components/shortlet/StayUI';
import { peakWeek, seasonRange } from '@/lib/stays';
import { shiftDay } from '@/lib/hostDates';

/** Fixed night-sky colours so the hero reads the same in light and dark mode. */
const NIGHT = {
  bg: '#121823',
  text: '#ffffff',
  soft: 'rgba(255,255,255,0.72)',
  amber: '#ffb454',
  amberSoft: 'rgba(255,180,84,0.16)',
};

const PROMISES: { icon: LucideIcon; title: string; body: string }[] = [
  {
    icon: Lock,
    title: 'Your money waits until you arrive',
    body: 'You pay GetRentos, not the host. The host is only paid after you check in.',
  },
  {
    icon: ShieldCheck,
    title: 'Not as described? You get it back',
    body: 'Tell us within 24 hours of check-in. We hold the host’s payment while we check.',
  },
  {
    icon: ClipboardCheck,
    title: 'Look for “Inspected”',
    body: 'A licensed agent has been inside those stays in the last year and rated every room.',
  },
  {
    icon: ReceiptText,
    title: 'The total, not a teaser',
    body: 'Every stay shows what you’ll actually pay for your dates: nights, cleaning and VAT.',
  },
];

type Week = 'first' | 'second' | 'season';

/** Detty December: the peak weeks, priced in full, from hosts guests can trust. */
export default function DettyDecember() {
  const { colors, spacing, radius } = useTheme();
  const insets = useSafeAreaInsets();
  const first = useMemo(() => peakWeek(), []);
  const [week, setWeek] = useState<Week>('first');

  const range = useMemo(() => {
    const seasonEnd = shiftDay(first.checkOut, 7); // 3 January
    if (week === 'second') return { checkIn: first.checkOut, checkOut: seasonEnd };
    if (week === 'season') return { checkIn: first.checkIn, checkOut: seasonEnd };
    return first;
  }, [first, week]);

  const weeks: { value: Week; label: string }[] = [
    { value: 'first', label: seasonRange(first.checkIn, first.checkOut) },
    { value: 'second', label: seasonRange(first.checkOut, shiftDay(first.checkOut, 7)) },
    { value: 'season', label: 'The whole season' },
  ];

  const header = (
    <View style={{ gap: spacing['2xl'], paddingBottom: spacing.lg }}>
      {/* Hero */}
      <View
        style={{
          backgroundColor: NIGHT.bg,
          paddingTop: insets.top + spacing.sm,
          paddingHorizontal: spacing.xl,
          paddingBottom: spacing['2xl'],
          borderBottomLeftRadius: radius['2xl'],
          borderBottomRightRadius: radius['2xl'],
          gap: spacing.lg,
        }}
      >
        <Pressable
          onPress={() => router.back()}
          accessibilityRole="button"
          accessibilityLabel="Go back"
          hitSlop={8}
          style={{
            width: 40,
            height: 40,
            borderRadius: 20,
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: 'rgba(255,255,255,0.1)',
          }}
        >
          <ChevronLeft size={22} color={NIGHT.text} />
        </Pressable>
        <View
          style={{
            alignSelf: 'flex-start',
            paddingHorizontal: 10,
            paddingVertical: 4,
            borderRadius: radius.full,
            backgroundColor: NIGHT.amberSoft,
          }}
        >
          <Text variant="label" style={{ color: NIGHT.amber }}>
            20 DEC – 3 JAN
          </Text>
        </View>
        <Text variant="display" style={{ color: NIGHT.text }} accessibilityRole="header">
          Detty December, sorted.
        </Text>
        <Text variant="body" style={{ color: NIGHT.soft }}>
          Flying home or hosting the whole family? Book a stay you can trust: your money is held
          until you walk in, and the price you see is the price you pay. Popular places go early,
          and many hosts ask for a minimum stay over the peak.
        </Text>
      </View>

      {/* Why book here */}
      <View style={{ paddingHorizontal: spacing.xl, gap: spacing.lg }}>
        {PROMISES.map((p) => (
          <View key={p.title} style={{ flexDirection: 'row', gap: spacing.md }}>
            <View
              style={{
                width: 40,
                height: 40,
                borderRadius: radius.md,
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: colors.accent,
              }}
            >
              <p.icon size={19} color={colors.primary} />
            </View>
            <View style={{ flex: 1, gap: 2 }}>
              <Text variant="bodyStrong">{p.title}</Text>
              <Text variant="callout" color="mutedForeground">
                {p.body}
              </Text>
            </View>
          </View>
        ))}
        <SupportContact lead="Questions before you book? Talk to a person." />
      </View>

      {/* The week */}
      <View style={{ gap: spacing.sm }}>
        <Text
          variant="heading"
          style={{ paddingHorizontal: spacing.xl }}
          accessibilityRole="header"
        >
          Stays for your week
        </Text>
        <View
          style={{
            flexDirection: 'row',
            flexWrap: 'wrap',
            gap: spacing.sm,
            paddingHorizontal: spacing.xl,
          }}
        >
          {weeks.map((w) => (
            <Chip
              key={w.value}
              label={w.label}
              selected={week === w.value}
              onPress={() => setWeek(w.value)}
            />
          ))}
        </View>
      </View>
    </View>
  );

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <StayResults
        filters={range}
        header={header}
        emptyTitle="Nothing free for these dates yet"
        emptyDescription="Try the other week, or check back: hosts add December dates all autumn."
      />
    </View>
  );
}
