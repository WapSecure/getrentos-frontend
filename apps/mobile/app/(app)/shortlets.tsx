import { useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  ArrowRight,
  CalendarDays,
  CalendarCheck,
  ChevronLeft,
  Heart,
  MessageSquare,
  Search,
  SlidersHorizontal,
  Sparkles,
  Users,
} from 'lucide-react-native';
import { Chip, IconButton, Text, TextField, useTheme } from '@getrentos/ui-native';
import type { ShortletFilters } from '@/lib/api/shortlets';
import { guestsLabel, isDettySeason, seasonRange } from '@/lib/stays';
import { haptics } from '@/lib/haptics';
import { StayResults } from '@/components/shortlet/StayResults';
import { StayDatesSheet, type StayDates } from '@/components/shortlet/StayDatesSheet';
import { GuestsSheet } from '@/components/shortlet/GuestsSheet';
import {
  QUICK_TOGGLES,
  StayFiltersSheet,
  refinementCount,
  type StayRefinements,
} from '@/components/shortlet/StayFiltersSheet';

/** Short stays: where, when, who — then every result priced for exactly that. */
export default function Shortlets() {
  const { colors, spacing, radius } = useTheme();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ checkIn?: string; checkOut?: string; guests?: string }>();

  const [searchText, setSearchText] = useState('');
  const [search, setSearch] = useState<string | undefined>();
  const [dates, setDates] = useState<StayDates | null>(
    params.checkIn && params.checkOut
      ? { checkIn: params.checkIn, checkOut: params.checkOut }
      : null
  );
  const [guests, setGuests] = useState<number | undefined>(
    params.guests ? Number(params.guests) || undefined : undefined
  );
  const [refine, setRefine] = useState<StayRefinements>({});
  const [sheet, setSheet] = useState<'dates' | 'guests' | 'filters' | null>(null);

  useEffect(() => {
    const t = setTimeout(() => setSearch(searchText.trim() || undefined), 350);
    return () => clearTimeout(t);
  }, [searchText]);

  const filters = useMemo<ShortletFilters>(
    () => ({ ...refine, search, guests, checkIn: dates?.checkIn, checkOut: dates?.checkOut }),
    [refine, search, guests, dates]
  );
  const activeCount = refinementCount(refine);

  const header = (
    <View style={{ paddingTop: spacing.sm, gap: spacing.lg, paddingBottom: spacing.lg }}>
      {/* Where · when · who */}
      <View
        style={{
          marginHorizontal: spacing.xl,
          borderRadius: radius.xl,
          borderWidth: 1,
          borderColor: colors.border,
          backgroundColor: colors.card,
          overflow: 'hidden',
        }}
      >
        <View style={{ padding: spacing.sm }}>
          <TextField
            placeholder="Search area, city or stay"
            accessibilityLabel="Search stays"
            leftIcon={<Search size={18} color={colors.mutedForeground} />}
            autoCapitalize="none"
            autoCorrect={false}
            returnKeyType="search"
            value={searchText}
            onChangeText={setSearchText}
          />
        </View>
        <View style={{ flexDirection: 'row', borderTopWidth: 1, borderTopColor: colors.border }}>
          <SearchCell
            icon={<CalendarDays size={17} color={colors.foreground} />}
            label="When"
            value={dates ? seasonRange(dates.checkIn, dates.checkOut) : 'Add dates'}
            placeholder={!dates}
            onPress={() => setSheet('dates')}
          />
          <View style={{ width: 1, backgroundColor: colors.border }} />
          <SearchCell
            icon={<Users size={17} color={colors.foreground} />}
            label="Who"
            value={guests ? guestsLabel(guests) : 'Add guests'}
            placeholder={!guests}
            onPress={() => setSheet('guests')}
          />
        </View>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: spacing.xl, gap: spacing.sm }}
      >
        <Chip
          label="Filters"
          leadingIcon={<SlidersHorizontal size={14} color={colors.foreground} />}
          count={activeCount || undefined}
          selected={activeCount > 0}
          onPress={() => setSheet('filters')}
        />
        {QUICK_TOGGLES.map((t) => (
          <Chip
            key={t.key}
            label={t.label}
            selected={!!refine[t.key]}
            onPress={() => setRefine((r) => ({ ...r, [t.key]: !r[t.key] || undefined }))}
          />
        ))}
      </ScrollView>

      {isDettySeason() && !dates ? <DettyBanner /> : null}
    </View>
  );

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: spacing.xs,
          paddingTop: insets.top + spacing.xs,
          paddingHorizontal: spacing.md,
          paddingBottom: spacing.xs,
        }}
      >
        <IconButton
          accessibilityLabel="Go back"
          onPress={() => router.back()}
          icon={<ChevronLeft size={22} color={colors.foreground} />}
          style={{ borderWidth: 0, backgroundColor: 'transparent' }}
        />
        <Text variant="title" style={{ flex: 1 }} accessibilityRole="header">
          Stays
        </Text>
        <IconButton
          accessibilityLabel="Messages with hosts"
          onPress={() => router.push('/(app)/shortlet-messages')}
          icon={<MessageSquare size={20} color={colors.foreground} />}
          style={{ borderWidth: 0, backgroundColor: 'transparent' }}
        />
        <IconButton
          accessibilityLabel="Wishlist"
          onPress={() => router.push('/(app)/shortlet-wishlist')}
          icon={<Heart size={20} color={colors.foreground} />}
          style={{ borderWidth: 0, backgroundColor: 'transparent' }}
        />
        <IconButton
          accessibilityLabel="My stays"
          onPress={() => router.push('/(app)/shortlet-bookings')}
          icon={<CalendarCheck size={20} color={colors.foreground} />}
          style={{ borderWidth: 0, backgroundColor: 'transparent' }}
        />
      </View>

      <StayResults filters={filters} header={header} />

      <StayDatesSheet
        open={sheet === 'dates'}
        onClose={() => setSheet(null)}
        value={dates}
        onChange={setDates}
      />
      <GuestsSheet
        open={sheet === 'guests'}
        onClose={() => setSheet(null)}
        value={guests}
        onChange={setGuests}
      />
      <StayFiltersSheet
        open={sheet === 'filters'}
        onClose={() => setSheet(null)}
        value={refine}
        onApply={setRefine}
      />
    </View>
  );
}

function SearchCell({
  icon,
  label,
  value,
  placeholder,
  onPress,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  placeholder: boolean;
  onPress: () => void;
}) {
  const { spacing } = useTheme();
  return (
    <Pressable
      onPress={() => {
        void haptics.tap();
        onPress();
      }}
      accessibilityRole="button"
      accessibilityLabel={`${label}: ${value}`}
      style={({ pressed }) => ({
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.sm,
        paddingVertical: spacing.md,
        paddingHorizontal: spacing.lg,
        opacity: pressed ? 0.7 : 1,
      })}
    >
      {icon}
      <View style={{ flex: 1 }}>
        <Text variant="label" color="mutedForeground">
          {label.toUpperCase()}
        </Text>
        <Text
          variant="bodyStrong"
          numberOfLines={1}
          color={placeholder ? 'mutedForeground' : 'foreground'}
        >
          {value}
        </Text>
      </View>
    </Pressable>
  );
}

/** Fixed night-sky colours: the banner looks the same in light and dark mode. */
const NIGHT = { bg: '#121823', border: 'rgba(255,255,255,0.08)', amber: '#ffb454' };

/** The season's front door: dark, quiet, one line of promise. */
function DettyBanner() {
  const { spacing, radius } = useTheme();
  return (
    <Pressable
      onPress={() => {
        void haptics.tap();
        router.push('/(app)/detty-december');
      }}
      accessibilityRole="button"
      accessibilityLabel="Detty December: peak-season stays you can trust, 20 December to 3 January"
      style={({ pressed }) => ({
        marginHorizontal: spacing.xl,
        borderRadius: radius.xl,
        padding: spacing.lg,
        backgroundColor: NIGHT.bg,
        borderWidth: 1,
        borderColor: NIGHT.border,
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.md,
        opacity: pressed ? 0.92 : 1,
      })}
    >
      <View
        style={{
          width: 44,
          height: 44,
          borderRadius: 22,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: 'rgba(255,180,84,0.18)',
        }}
      >
        <Sparkles size={20} color={NIGHT.amber} />
      </View>
      <View style={{ flex: 1, gap: 2 }}>
        <Text variant="label" style={{ color: NIGHT.amber }}>
          DETTY DECEMBER
        </Text>
        <Text variant="bodyStrong" style={{ color: '#ffffff' }}>
          Book a stay you can trust
        </Text>
        <Text variant="caption" style={{ color: 'rgba(255,255,255,0.72)' }}>
          20 Dec – 3 Jan · money held until you arrive
        </Text>
      </View>
      <ArrowRight size={18} color="#ffffff" />
    </Pressable>
  );
}
