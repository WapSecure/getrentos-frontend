import { useMemo, useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Lock } from 'lucide-react-native';
import {
  Button,
  Card,
  Chip,
  EmptyState,
  FormAlert,
  SegmentedControl,
  Skeleton,
  Text,
  TextField,
  useTheme,
  useToast,
} from '@getrentos/ui-native';
import { qk } from '@/lib/query/keys';
import {
  INTERNET_TYPES,
  POWER_SOURCES,
  WATER_SUPPLY,
  hostShortletsApi,
  type HostListing,
} from '@/lib/api/hostShortlets';
import { ApiError } from '@/lib/api/client';
import { haptics } from '@/lib/haptics';
import { DetailHeader } from '@/components/dashboard/DetailHeader';
import { Stepper } from '@/components/host/HostUI';

type Tri = 'unset' | 'yes' | 'no';
const toTri = (v?: boolean): Tri => (v == null ? 'unset' : v ? 'yes' : 'no');
const fromTri = (v: Tri): boolean | null => (v === 'unset' ? null : v === 'yes');
const TRI_OPTIONS: { value: Tri; label: string }[] = [
  { value: 'unset', label: 'Not said' },
  { value: 'yes', label: 'Allowed' },
  { value: 'no', label: 'No' },
];

/**
 * What guests need to know before they book (rules, power, water, internet)
 * and what only a paid guest sees (how to get in).
 */
export default function HostEssentials() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { colors, spacing, radius } = useTheme();
  const insets = useSafeAreaInsets();
  const listings = useQuery({
    queryKey: qk.host.listings,
    queryFn: () => hostShortletsApi.listings(),
  });
  const l = listings.data?.items.find((x) => x.id === id);

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: colors.background }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      {listings.isPending ? (
        <View style={{ padding: spacing.xl, paddingTop: insets.top + spacing['4xl'] }}>
          <Skeleton height={320} radius={radius.lg} />
        </View>
      ) : !l ? (
        <EmptyState title="Listing not found" />
      ) : (
        <Form listing={l} key={l.id} />
      )}
    </KeyboardAvoidingView>
  );
}

function Form({ listing: l }: { listing: HostListing }) {
  const { colors, spacing } = useTheme();
  const insets = useSafeAreaInsets();
  const qc = useQueryClient();
  const toast = useToast();
  const initial = useMemo(
    () => ({
      pets: toTri(l.petsAllowed),
      smoking: toTri(l.smokingAllowed),
      parties: toTri(l.partiesAllowed),
      rules: l.houseRules ?? '',
      power: l.powerSources ?? [],
      powerHours: l.powerHoursPerDay ?? 24,
      water: l.waterSupply ?? '',
      internet: l.internetType ?? '',
      speed: l.internetSpeedMbps ? String(l.internetSpeedMbps) : '',
      checkIn: l.checkInInstructions ?? '',
    }),
    [l]
  );
  const [f, setF] = useState(initial);
  const set = (p: Partial<typeof f>) => setF((x) => ({ ...x, ...p }));
  const changed = JSON.stringify(f) !== JSON.stringify(initial);

  const save = useMutation({
    mutationFn: () =>
      hostShortletsApi.update(l.id, {
        petsAllowed: fromTri(f.pets),
        smokingAllowed: fromTri(f.smoking),
        partiesAllowed: fromTri(f.parties),
        houseRules: f.rules.trim() || null,
        powerSources: f.power,
        powerHoursPerDay: f.power.length ? f.powerHours : null,
        waterSupply: f.water || null,
        internetType: f.internet || null,
        internetSpeedMbps:
          f.internet && f.internet !== 'NONE' && Number(f.speed) > 0 ? Number(f.speed) : null,
        checkInInstructions: f.checkIn.trim() || null,
      }),
    onSuccess: () => {
      void haptics.success();
      qc.invalidateQueries({ queryKey: qk.host.listings });
      toast.show('Saved. Guests see this on the listing.', 'success');
      router.back();
    },
    onError: () => void haptics.error(),
  });

  return (
    <>
      <ScrollView
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{
          paddingTop: insets.top + spacing.md,
          paddingHorizontal: spacing.xl,
          paddingBottom: spacing['3xl'],
          gap: spacing.xl,
        }}
      >
        <DetailHeader
          eyebrow="Essentials"
          title="House rules & basics"
          subtitle={l.title}
          onBack={() => router.back()}
        />

        <Section title="House rules">
          {(
            [
              ['Pets', 'pets'],
              ['Smoking', 'smoking'],
              ['Parties & events', 'parties'],
            ] as const
          ).map(([label, key]) => (
            <View key={key} style={{ gap: spacing.xs }}>
              <Text variant="callout" style={{ fontWeight: '600' }}>
                {label}
              </Text>
              <SegmentedControl
                accessibilityLabel={label}
                value={f[key]}
                onChange={(v) => set({ [key]: v } as Partial<typeof f>)}
                options={TRI_OPTIONS}
              />
            </View>
          ))}
          <TextField
            label="Anything else"
            value={f.rules}
            onChangeText={(rules) => set({ rules })}
            multiline
            maxLength={2000}
            hint="e.g. quiet hours from 10pm, visitors registered at the gate"
          />
        </Section>

        <Section title="Power">
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>
            {POWER_SOURCES.map((p) => {
              const on = f.power.includes(p.value);
              return (
                <Chip
                  key={p.value}
                  label={p.label}
                  selected={on}
                  onPress={() =>
                    set({
                      power: on ? f.power.filter((x) => x !== p.value) : [...f.power, p.value],
                    })
                  }
                />
              );
            })}
          </View>
          {f.power.length ? (
            <Stepper
              label="Hours of power a day"
              hint="On a typical day, all sources together"
              value={f.powerHours}
              min={0}
              max={24}
              suffix="h"
              onChange={(powerHours) => set({ powerHours })}
            />
          ) : null}
        </Section>

        <Section title="Water">
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>
            {WATER_SUPPLY.map((w) => (
              <Chip
                key={w.value}
                label={w.label}
                selected={f.water === w.value}
                onPress={() => set({ water: f.water === w.value ? '' : w.value })}
              />
            ))}
          </View>
        </Section>

        <Section title="Internet">
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>
            {INTERNET_TYPES.map((i) => (
              <Chip
                key={i.value}
                label={i.label}
                selected={f.internet === i.value}
                onPress={() => set({ internet: f.internet === i.value ? '' : i.value })}
              />
            ))}
          </View>
          {f.internet && f.internet !== 'NONE' ? (
            <TextField
              label="Usual speed (Mbps)"
              keyboardType="number-pad"
              value={f.speed}
              onChangeText={(speed) => set({ speed: speed.replace(/\D/g, '') })}
              hint="Optional. Remote workers look for this."
            />
          ) : null}
        </Section>

        <Section title="How to get in">
          <View style={{ flexDirection: 'row', gap: spacing.sm, alignItems: 'flex-start' }}>
            <Lock size={15} color={colors.mutedForeground} style={{ marginTop: 2 }} />
            <Text variant="caption" color="mutedForeground" style={{ flex: 1 }}>
              Private. Shown only to a guest whose stay is confirmed and paid.
            </Text>
          </View>
          <TextField
            label="Check-in instructions"
            value={f.checkIn}
            onChangeText={(checkIn) => set({ checkIn })}
            multiline
            maxLength={2000}
            hint="Gate, key box code, Wi-Fi name and password"
          />
        </Section>

        {save.error ? (
          <FormAlert
            message={save.error instanceof ApiError ? save.error.message : 'Could not save.'}
          />
        ) : null}
      </ScrollView>
      <View
        style={{
          paddingHorizontal: spacing.xl,
          paddingTop: spacing.md,
          paddingBottom: insets.bottom + spacing.md,
          borderTopWidth: 1,
          borderTopColor: colors.border,
          backgroundColor: colors.card,
        }}
      >
        <Button
          label="Save"
          disabled={!changed}
          loading={save.isPending}
          onPress={() => save.mutate()}
        />
      </View>
    </>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  const { spacing } = useTheme();
  return (
    <View style={{ gap: spacing.sm }}>
      <Text variant="heading" accessibilityRole="header">
        {title}
      </Text>
      <Card elevated style={{ gap: spacing.md }}>
        {children}
      </Card>
    </View>
  );
}
