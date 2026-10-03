import { useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, Pressable, ScrollView, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { PartyPopper, Plus, Trash2 } from 'lucide-react-native';
import {
  Button,
  Card,
  DateField,
  Divider,
  EmptyState,
  FormAlert,
  IconButton,
  Price,
  Skeleton,
  Text,
  TextField,
  toISODate,
  useTheme,
  useToast,
} from '@getrentos/ui-native';
import { qk } from '@/lib/query/keys';
import {
  dettyDecember,
  hostShortletsApi,
  type HostListing,
  type ShortletSeason,
} from '@/lib/api/hostShortlets';
import { ApiError } from '@/lib/api/client';
import { haptics } from '@/lib/haptics';
import { DetailHeader } from '@/components/dashboard/DetailHeader';
import { Sheet } from '@/components/Sheet';
import { Stepper } from '@/components/host/HostUI';

/**
 * How the price moves: discounts for long and last-minute stays, notice and
 * turnover days, and seasons with their own rate and minimum stay.
 */
export default function HostPricing() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { colors, spacing, radius } = useTheme();
  const insets = useSafeAreaInsets();
  const listings = useQuery({
    queryKey: qk.host.listings,
    queryFn: () => hostShortletsApi.listings(),
  });
  const l = listings.data?.items.find((x) => x.id === id);

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.background }}
      contentContainerStyle={{
        paddingTop: insets.top + spacing.md,
        paddingHorizontal: spacing.xl,
        paddingBottom: insets.bottom + spacing['3xl'],
        gap: spacing.xl,
      }}
    >
      <DetailHeader
        eyebrow="Pricing"
        title="Rules & seasons"
        subtitle={l?.title}
        onBack={() => router.back()}
      />
      {listings.isPending ? (
        <Skeleton height={260} radius={radius.lg} />
      ) : !l ? (
        <EmptyState title="Listing not found" />
      ) : (
        <>
          <Seasons listing={l} />
          <Rules listing={l} key={l.id} />
        </>
      )}
    </ScrollView>
  );
}

function Rules({ listing: l }: { listing: HostListing }) {
  const { spacing } = useTheme();
  const qc = useQueryClient();
  const toast = useToast();
  const perNight = l.pricingMode === 'PER_NIGHT';
  const initial = {
    weekly: l.weeklyDiscountPct ?? 0,
    twoWeek: l.twoWeekDiscountPct ?? 0,
    monthly: l.monthlyDiscountPct ?? 0,
    lastMinute: l.lastMinuteDiscountPct ?? 0,
    lastMinuteDays: l.lastMinuteDays || 3,
    notice: l.advanceNoticeDays ?? 0,
    prep: l.prepDays ?? 0,
  };
  const [r, setR] = useState(initial);
  const set = (p: Partial<typeof r>) => setR((x) => ({ ...x, ...p }));
  const changed = JSON.stringify(r) !== JSON.stringify(initial);

  const save = useMutation({
    mutationFn: () =>
      hostShortletsApi.update(l.id, {
        weeklyDiscountPct: r.weekly,
        twoWeekDiscountPct: r.twoWeek,
        monthlyDiscountPct: r.monthly,
        lastMinuteDiscountPct: r.lastMinute,
        lastMinuteDays: r.lastMinuteDays,
        advanceNoticeDays: r.notice,
        prepDays: r.prep,
      }),
    onSuccess: () => {
      void haptics.success();
      qc.invalidateQueries({ queryKey: qk.host.listings });
      toast.show('Pricing rules saved.', 'success');
    },
    onError: (err) =>
      toast.show(err instanceof ApiError ? err.message : 'Could not save.', 'error'),
  });

  return (
    <View style={{ gap: spacing.md }}>
      {perNight ? (
        <>
          <Text variant="heading" accessibilityRole="header">
            Discounts
          </Text>
          <Card elevated style={{ gap: spacing.xs }}>
            <Stepper
              label="Weekly"
              hint="7 nights or more"
              value={r.weekly}
              max={90}
              step={5}
              suffix="%"
              onChange={(weekly) => set({ weekly })}
            />
            <Divider />
            <Stepper
              label="Two weeks"
              hint="14 nights or more"
              value={r.twoWeek}
              max={90}
              step={5}
              suffix="%"
              onChange={(twoWeek) => set({ twoWeek })}
            />
            <Divider />
            <Stepper
              label="Monthly"
              hint="28 nights or more"
              value={r.monthly}
              max={90}
              step={5}
              suffix="%"
              onChange={(monthly) => set({ monthly })}
            />
            <Divider />
            <Stepper
              label="Last-minute"
              hint={`Booked within ${r.lastMinuteDays} day${r.lastMinuteDays === 1 ? '' : 's'} of arrival`}
              value={r.lastMinute}
              max={90}
              step={5}
              suffix="%"
              onChange={(lastMinute) => set({ lastMinute })}
            />
            {r.lastMinute ? (
              <Stepper
                label="Last-minute window"
                value={r.lastMinuteDays}
                min={1}
                max={30}
                suffix="d"
                onChange={(lastMinuteDays) => set({ lastMinuteDays })}
              />
            ) : null}
          </Card>
          <Text variant="caption" color="mutedForeground">
            Guests get the single biggest discount that applies, never two at once.
          </Text>
        </>
      ) : null}

      <Text variant="heading" accessibilityRole="header">
        Turnover
      </Text>
      <Card elevated style={{ gap: spacing.xs }}>
        <Stepper
          label="Notice before arrival"
          hint={
            r.notice
              ? `Guests must book ${r.notice}+ day${r.notice === 1 ? '' : 's'} ahead`
              : 'Same-day bookings allowed'
          }
          value={r.notice}
          max={30}
          suffix="d"
          onChange={(notice) => set({ notice })}
        />
        <Divider />
        <Stepper
          label="Prep time"
          hint="Nights kept free before and after each stay"
          value={r.prep}
          max={7}
          suffix="d"
          onChange={(prep) => set({ prep })}
        />
      </Card>
      <Button
        label="Save rules"
        disabled={!changed}
        loading={save.isPending}
        onPress={() => save.mutate()}
      />
    </View>
  );
}

function Seasons({ listing: l }: { listing: HostListing }) {
  const { colors, spacing, radius } = useTheme();
  const qc = useQueryClient();
  const toast = useToast();
  const [adding, setAdding] = useState<null | { preset?: 'detty' }>(null);
  const seasons = useQuery({
    queryKey: qk.host.seasons(l.id),
    queryFn: () => hostShortletsApi.seasons(l.id),
  });
  const remove = useMutation({
    mutationFn: (s: ShortletSeason) => hostShortletsApi.deleteSeason(s.id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk.host.seasons(l.id) });
      qc.invalidateQueries({ queryKey: qk.host.listings });
      toast.show('Season removed.', 'success');
    },
    onError: (err) =>
      toast.show(err instanceof ApiError ? err.message : 'Could not remove it.', 'error'),
  });
  const hasDetty = seasons.data?.some((s) => /detty/i.test(s.name));
  const fmt = (iso: string) =>
    new Date(`${iso.slice(0, 10)}T12:00:00`).toLocaleDateString('en-NG', {
      day: 'numeric',
      month: 'short',
    });

  return (
    <View style={{ gap: spacing.md }}>
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        <Text variant="heading" accessibilityRole="header" style={{ flex: 1 }}>
          Seasons
        </Text>
        <IconButton
          accessibilityLabel="Add a season"
          icon={<Plus size={20} color={colors.primary} />}
          onPress={() => setAdding({})}
        />
      </View>
      {!hasDetty && seasons.data ? (
        <Pressable
          onPress={() => setAdding({ preset: 'detty' })}
          accessibilityRole="button"
          accessibilityLabel="Add Detty December season, 20 December to 3 January"
          style={({ pressed }) => ({
            flexDirection: 'row',
            alignItems: 'center',
            gap: spacing.md,
            padding: spacing.lg,
            borderRadius: radius.lg,
            backgroundColor: pressed ? colors.warningSubtle : colors.card,
            borderWidth: 1,
            borderColor: colors.warning,
          })}
        >
          <PartyPopper size={22} color={colors.warning} />
          <View style={{ flex: 1 }}>
            <Text variant="bodyStrong">Price for Detty December</Text>
            <Text variant="caption" color="mutedForeground">
              20 Dec – 3 Jan, when diaspora guests fly home and Lagos books out.
            </Text>
          </View>
        </Pressable>
      ) : null}
      {seasons.isPending ? (
        <Skeleton height={72} radius={radius.lg} />
      ) : !seasons.data?.length ? (
        <Text variant="callout" color="mutedForeground">
          No seasons yet. A season sets its own nightly rate and minimum stay for a date range.
        </Text>
      ) : (
        seasons.data.map((s) => (
          <Card
            key={s.id}
            elevated
            style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md }}
          >
            <View style={{ flex: 1, gap: 2 }}>
              <Text variant="bodyStrong">{s.name}</Text>
              <Text variant="caption" color="mutedForeground">
                {fmt(s.startDate)} – {fmt(s.endDate)}
                {s.minNights ? ` · ${s.minNights}+ nights` : ''}
              </Text>
            </View>
            {s.nightlyRate ? <Price amount={s.nightlyRate} variant="callout" /> : null}
            <IconButton
              accessibilityLabel={`Delete ${s.name}`}
              icon={<Trash2 size={18} color={colors.mutedForeground} />}
              onPress={() =>
                Alert.alert(`Delete ${s.name}?`, 'Nights in it go back to your normal price.', [
                  { text: 'Keep', style: 'cancel' },
                  { text: 'Delete', style: 'destructive', onPress: () => remove.mutate(s) },
                ])
              }
            />
          </Card>
        ))
      )}
      <Sheet open={!!adding} onClose={() => setAdding(null)} title="New season">
        {adding ? (
          <SeasonForm
            listing={l}
            preset={adding.preset}
            onDone={() => setAdding(null)}
            key={adding.preset ?? 'blank'}
          />
        ) : null}
      </Sheet>
    </View>
  );
}

function SeasonForm({
  listing: l,
  preset,
  onDone,
}: {
  listing: HostListing;
  preset?: 'detty';
  onDone: () => void;
}) {
  const { spacing } = useTheme();
  const qc = useQueryClient();
  const toast = useToast();
  const detty = dettyDecember();
  const [name, setName] = useState(preset ? 'Detty December' : '');
  const [start, setStart] = useState(preset ? detty.startDate : '');
  const [end, setEnd] = useState(preset ? detty.endDate : '');
  const [rate, setRate] = useState(
    preset && l.nightlyRate ? String(Math.round((l.nightlyRate * 1.5) / 1000) * 1000) : ''
  );
  const [minNights, setMinNights] = useState(preset ? 5 : l.minNights);
  const value = Number(rate.replace(/\D/g, '')) || 0;

  const add = useMutation({
    mutationFn: () =>
      hostShortletsApi.addSeason(l.id, {
        name: name.trim(),
        startDate: start,
        endDate: end,
        ...(value ? { nightlyRate: value } : {}),
        ...(minNights !== l.minNights ? { minNights } : {}),
      }),
    onSuccess: () => {
      void haptics.success();
      qc.invalidateQueries({ queryKey: qk.host.seasons(l.id) });
      qc.invalidateQueries({ queryKey: qk.host.listings });
      toast.show(`${name.trim()} added.`, 'success');
      onDone();
    },
  });

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={{ gap: spacing.md }}>
        <TextField label="Name" value={name} onChangeText={setName} maxLength={60} />
        <View style={{ flexDirection: 'row', gap: spacing.md }}>
          <View style={{ flex: 1 }}>
            <DateField
              label="First night"
              value={start}
              onChange={setStart}
              min={toISODate(new Date())}
            />
          </View>
          <View style={{ flex: 1 }}>
            <DateField label="Last night" value={end} onChange={setEnd} min={start || undefined} />
          </View>
        </View>
        {l.pricingMode === 'PER_NIGHT' ? (
          <TextField
            label="Nightly rate (₦)"
            keyboardType="number-pad"
            value={value ? value.toLocaleString('en-NG') : ''}
            onChangeText={setRate}
            hint={
              l.nightlyRate
                ? `Your usual rate is ₦${l.nightlyRate.toLocaleString('en-NG')}. Blank keeps it.`
                : 'Blank keeps your usual rate.'
            }
          />
        ) : null}
        <Stepper
          label="Minimum stay"
          value={minNights}
          min={1}
          max={90}
          suffix=" n"
          onChange={setMinNights}
        />
        {add.error ? (
          <FormAlert
            message={add.error instanceof ApiError ? add.error.message : 'Could not add it.'}
          />
        ) : null}
        <Button
          label="Add season"
          disabled={!name.trim() || !start || !end || end < start}
          loading={add.isPending}
          onPress={() => add.mutate()}
        />
      </View>
    </KeyboardAvoidingView>
  );
}
