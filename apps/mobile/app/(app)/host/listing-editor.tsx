import { useMemo, useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, Switch, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Check } from 'lucide-react-native';
import {
  Button,
  Card,
  Chip,
  EmptyState,
  FormAlert,
  Progress,
  SegmentedControl,
  Skeleton,
  Text,
  TextField,
  TimeField,
  formatTimeLabel,
  useTheme,
  useToast,
} from '@getrentos/ui-native';
import { qk } from '@/lib/query/keys';
import {
  AMENITIES,
  CANCELLATION_POLICIES,
  hostShortletsApi,
  type HostListing,
  type PricingMode,
} from '@/lib/api/hostShortlets';
import type { ShortletCancellationPolicy } from '@/lib/api/shortlets';
import { ownerApi } from '@/lib/api/owner';
import { landlordApi } from '@/lib/api/landlord';
import { ApiError } from '@/lib/api/client';
import { useAuth } from '@/lib/auth/AuthProvider';
import { readGate } from '@/lib/verificationGate';
import { haptics } from '@/lib/haptics';
import { DetailHeader } from '@/components/dashboard/DetailHeader';
import { VerificationGateNotice } from '@/components/VerificationGateNotice';
import { Stepper, Thumb } from '@/components/host/HostUI';

interface Draft {
  propertyId: string;
  title: string;
  maxGuests: number;
  minNights: number;
  checkInTime: string;
  checkOutTime: string;
  instantBooking: boolean;
  furnished: boolean;
  amenities: string[];
  pricingMode: PricingMode;
  rate: string;
  cleaning: string;
  deposit: string;
  weekendUplift: number;
  policy: ShortletCancellationPolicy;
}

const blank: Draft = {
  propertyId: '',
  title: '',
  maxGuests: 2,
  minNights: 1,
  checkInTime: '14:00',
  checkOutTime: '11:00',
  instantBooking: false,
  furnished: true,
  amenities: [],
  pricingMode: 'PER_NIGHT',
  rate: '',
  cleaning: '',
  deposit: '',
  weekendUplift: 0,
  policy: 'MODERATE',
};

const fromListing = (l: HostListing): Draft => ({
  propertyId: l.propertyId,
  title: l.title,
  maxGuests: l.maxGuests,
  minNights: l.minNights,
  checkInTime: l.checkInTime ?? '14:00',
  checkOutTime: l.checkOutTime ?? '11:00',
  instantBooking: l.instantBooking,
  furnished: l.furnished,
  amenities: l.amenities ?? [],
  pricingMode: l.pricingMode,
  rate: l.nightlyRate ? String(l.nightlyRate) : '',
  cleaning: l.cleaningFee ? String(l.cleaningFee) : '',
  deposit: l.deposit ? String(l.deposit) : '',
  weekendUplift: l.weekendUpliftPct ?? 0,
  policy: l.cancellationPolicy,
});

const naira = (v: string) => Number(v.replace(/\D/g, '')) || 0;
const show = (v: string) => (naira(v) ? naira(v).toLocaleString('en-NG') : '');

const STEPS = ['Home', 'The stay', 'Price', 'Review'] as const;

/**
 * New listing: a short guided flow, one decision per screen. Editing: the same
 * sections on one page. Photos default to the property's own, so a host can
 * go live without re-uploading anything.
 */
export default function ListingEditor() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const listings = useQuery({
    queryKey: qk.host.listings,
    queryFn: () => hostShortletsApi.listings(),
    enabled: !!id,
  });
  const existing = id ? listings.data?.items.find((l) => l.id === id) : undefined;

  if (id && !existing) {
    return listings.isPending ? <Loading /> : <EmptyState title="Listing not found" />;
  }
  return existing ? <EditForm listing={existing} /> : <CreateFlow />;
}

function Loading() {
  const { colors, spacing, radius } = useTheme();
  const insets = useSafeAreaInsets();
  return (
    <View
      style={{
        flex: 1,
        backgroundColor: colors.background,
        paddingTop: insets.top + spacing['4xl'],
        paddingHorizontal: spacing.xl,
        gap: spacing.md,
      }}
    >
      <Skeleton height={240} radius={radius.lg} />
    </View>
  );
}

/* --------------------------------- create --------------------------------- */

function CreateFlow() {
  const { colors, spacing } = useTheme();
  const insets = useSafeAreaInsets();
  const qc = useQueryClient();
  const toast = useToast();
  const [step, setStep] = useState(0);
  const [d, setD] = useState<Draft>(blank);
  const patch = (p: Partial<Draft>) => setD((x) => ({ ...x, ...p }));

  const create = useMutation({
    mutationFn: () =>
      hostShortletsApi.create({
        propertyId: d.propertyId,
        listingTitle: d.title.trim() || undefined,
        maxGuests: d.maxGuests,
        minNights: d.minNights,
        checkInTime: d.checkInTime,
        checkOutTime: d.checkOutTime,
        instantBooking: d.instantBooking,
        furnished: d.furnished,
        amenities: d.amenities,
        pricingMode: d.pricingMode,
        nightlyRate: naira(d.rate),
        cleaningFee: naira(d.cleaning) || undefined,
        deposit: naira(d.deposit) || undefined,
        weekendUpliftPct: d.weekendUplift || undefined,
        cancellationPolicy: d.policy,
      }),
    onSuccess: (listing) => {
      void haptics.success();
      qc.invalidateQueries({ queryKey: qk.host.listings });
      toast.show(
        listing.status === 'PUBLISHED'
          ? 'Your listing is live.'
          : 'Listing created. It goes live once the property is approved.',
        'success'
      );
      router.replace({ pathname: '/(app)/host/listing/[id]', params: { id: listing.id } });
    },
    onError: () => void haptics.error(),
  });

  const canNext = [!!d.propertyId, d.maxGuests > 0 && d.minNights > 0, naira(d.rate) > 0, true][
    step
  ];

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: colors.background }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{
          paddingTop: insets.top + spacing.md,
          paddingHorizontal: spacing.xl,
          paddingBottom: spacing['3xl'],
          gap: spacing.lg,
        }}
      >
        <DetailHeader
          eyebrow={`Step ${step + 1} of ${STEPS.length}`}
          title={['Which home?', 'About the stay', 'Set your price', 'Ready to publish'][step]}
          onBack={() => (step ? setStep(step - 1) : router.back())}
        />
        <Progress
          value={(step + 1) / STEPS.length}
          accessibilityLabel={`Step ${step + 1} of ${STEPS.length}: ${STEPS[step]}`}
        />
        {step === 0 ? <HomeStep d={d} patch={patch} /> : null}
        {step === 1 ? <StayStep d={d} patch={patch} /> : null}
        {step === 2 ? <PriceStep d={d} patch={patch} /> : null}
        {step === 3 ? <ReviewStep d={d} onJump={setStep} /> : null}
        {create.error ? (
          readGate(create.error) ? (
            <VerificationGateNotice error={create.error} />
          ) : (
            <FormAlert
              message={
                create.error instanceof ApiError
                  ? create.error.message
                  : 'We couldn’t publish this. Try again.'
              }
            />
          )
        ) : null}
      </ScrollView>
      <View
        style={{
          flexDirection: 'row',
          gap: spacing.sm,
          paddingHorizontal: spacing.xl,
          paddingTop: spacing.md,
          paddingBottom: insets.bottom + spacing.md,
          borderTopWidth: 1,
          borderTopColor: colors.border,
          backgroundColor: colors.card,
        }}
      >
        {step ? <Button label="Back" variant="ghost" onPress={() => setStep(step - 1)} /> : null}
        <Button
          label={step === STEPS.length - 1 ? 'Publish listing' : 'Continue'}
          style={{ flex: 1 }}
          disabled={!canNext}
          loading={create.isPending}
          onPress={() => {
            void haptics.tap();
            if (step === STEPS.length - 1) create.mutate();
            else setStep(step + 1);
          }}
        />
      </View>
    </KeyboardAvoidingView>
  );
}

function HomeStep({ d, patch }: { d: Draft; patch: (p: Partial<Draft>) => void }) {
  const { colors, spacing, radius } = useTheme();
  const { usablePortal } = useAuth();
  const homes = useQuery({
    queryKey: ['host', 'homes', usablePortal],
    queryFn: async () =>
      usablePortal === 'landlord'
        ? (await landlordApi.properties(1, 100)).items.map((p) => ({
            id: p.id,
            name: p.name,
            city: p.city,
            image: p.coverImage,
          }))
        : (await ownerApi.properties(1, 100)).items.map((p) => ({
            id: p.id,
            name: p.name,
            city: p.city,
            image: p.coverImageUrl,
          })),
  });
  return (
    <View style={{ gap: spacing.md }}>
      <Text variant="callout" color="mutedForeground">
        Guests will see this home’s photos until you add your own.
      </Text>
      {homes.isPending ? (
        <Skeleton height={80} radius={radius.lg} />
      ) : !homes.data?.length ? (
        <EmptyState
          title="No properties yet"
          description="Add the property first, then come back to host it."
        />
      ) : (
        homes.data.map((h) => {
          const on = d.propertyId === h.id;
          return (
            <Pressable
              key={h.id}
              onPress={() => {
                void haptics.tap();
                patch({ propertyId: h.id, title: d.title || h.name });
              }}
              accessibilityRole="radio"
              accessibilityState={{ checked: on }}
              accessibilityLabel={`${h.name}, ${h.city}`}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: spacing.md,
                padding: spacing.md,
                borderRadius: radius.lg,
                borderWidth: on ? 2 : 1,
                borderColor: on ? colors.primary : colors.border,
                backgroundColor: colors.card,
              }}
            >
              <Thumb uri={h.image} size={56} />
              <View style={{ flex: 1 }}>
                <Text variant="bodyStrong" numberOfLines={1}>
                  {h.name}
                </Text>
                <Text variant="caption" color="mutedForeground">
                  {h.city}
                </Text>
              </View>
              {on ? <Check size={20} color={colors.primary} /> : null}
            </Pressable>
          );
        })
      )}
      {d.propertyId ? (
        <TextField
          label="Listing title"
          value={d.title}
          onChangeText={(title) => patch({ title })}
          hint="What guests see first, e.g. “Ikoyi 2-bed with pool view”"
          maxLength={120}
        />
      ) : null}
    </View>
  );
}

function StayStep({ d, patch }: { d: Draft; patch: (p: Partial<Draft>) => void }) {
  const { colors, spacing } = useTheme();
  return (
    <View style={{ gap: spacing.lg }}>
      <Card elevated style={{ gap: spacing.xs }}>
        <Stepper
          label="Guests"
          value={d.maxGuests}
          min={1}
          max={30}
          onChange={(maxGuests) => patch({ maxGuests })}
        />
        <Stepper
          label="Minimum nights"
          value={d.minNights}
          min={1}
          max={90}
          onChange={(minNights) => patch({ minNights })}
        />
      </Card>
      <View style={{ flexDirection: 'row', gap: spacing.md }}>
        <View style={{ flex: 1 }}>
          <TimeField
            label="Check-in from"
            value={d.checkInTime}
            onChange={(checkInTime) => patch({ checkInTime })}
          />
        </View>
        <View style={{ flex: 1 }}>
          <TimeField
            label="Check-out by"
            value={d.checkOutTime}
            onChange={(checkOutTime) => patch({ checkOutTime })}
          />
        </View>
      </View>
      <Card elevated style={{ gap: spacing.md }}>
        <SwitchRow
          label="Instant booking"
          hint="Guests book without waiting for you. Listings with it get more bookings."
          value={d.instantBooking}
          onChange={(instantBooking) => patch({ instantBooking })}
        />
        <SwitchRow
          label="Furnished and ready"
          hint="Beds, linen and kitchen basics are in place."
          value={d.furnished}
          onChange={(furnished) => patch({ furnished })}
        />
      </Card>
      <View style={{ gap: spacing.sm }}>
        <Text variant="bodyStrong">What guests get</Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>
          {AMENITIES.map((a) => {
            const on = d.amenities.includes(a);
            return (
              <Chip
                key={a}
                label={a}
                selected={on}
                onPress={() =>
                  patch({
                    amenities: on ? d.amenities.filter((x) => x !== a) : [...d.amenities, a],
                  })
                }
              />
            );
          })}
        </View>
        <Text variant="caption" style={{ color: colors.mutedForeground }}>
          Guests filter on these, so tick everything that’s true.
        </Text>
      </View>
    </View>
  );
}

function PriceStep({ d, patch }: { d: Draft; patch: (p: Partial<Draft>) => void }) {
  const { spacing } = useTheme();
  const perNight = d.pricingMode === 'PER_NIGHT';
  const nights = Math.max(3, d.minNights);
  const sample = perNight ? naira(d.rate) * nights + naira(d.cleaning) : naira(d.rate);
  return (
    <View style={{ gap: spacing.lg }}>
      <SegmentedControl
        accessibilityLabel="How you charge"
        value={d.pricingMode}
        onChange={(pricingMode) => patch({ pricingMode })}
        options={[
          { value: 'PER_NIGHT', label: 'Per night' },
          { value: 'FLAT_STAY', label: 'Flat per stay' },
        ]}
      />
      <TextField
        label={perNight ? 'Nightly rate (₦)' : 'Price per stay (₦)'}
        keyboardType="number-pad"
        value={show(d.rate)}
        onChangeText={(rate) => patch({ rate })}
      />
      <View style={{ flexDirection: 'row', gap: spacing.md }}>
        <View style={{ flex: 1 }}>
          <TextField
            label="Cleaning fee (₦)"
            keyboardType="number-pad"
            value={show(d.cleaning)}
            onChangeText={(cleaning) => patch({ cleaning })}
            hint="Optional, once per stay"
          />
        </View>
        <View style={{ flex: 1 }}>
          <TextField
            label="Deposit (₦)"
            keyboardType="number-pad"
            value={show(d.deposit)}
            onChangeText={(deposit) => patch({ deposit })}
            hint="Refunded after check-out"
          />
        </View>
      </View>
      {perNight ? (
        <Card elevated>
          <Stepper
            label="Weekend uplift"
            hint="Added to Friday and Saturday nights"
            value={d.weekendUplift}
            min={0}
            max={100}
            step={5}
            suffix="%"
            onChange={(weekendUplift) => patch({ weekendUplift })}
          />
        </Card>
      ) : null}
      {sample > 0 ? (
        <Text variant="callout" color="mutedForeground">
          {perNight
            ? `A ${nights}-night stay comes to about ₦${sample.toLocaleString('en-NG')} before fees and tax.`
            : `Every stay is ₦${sample.toLocaleString('en-NG')} before fees and tax.`}
        </Text>
      ) : null}
      <View style={{ gap: spacing.sm }}>
        <Text variant="bodyStrong">Cancellation policy</Text>
        {CANCELLATION_POLICIES.map((p) => (
          <PolicyOption
            key={p.value}
            label={p.label}
            hint={p.hint}
            selected={d.policy === p.value}
            onPress={() => patch({ policy: p.value })}
          />
        ))}
      </View>
    </View>
  );
}

function ReviewStep({ d, onJump }: { d: Draft; onJump: (step: number) => void }) {
  const { spacing } = useTheme();
  const rows: [string, string, number][] = [
    ['Title', d.title || 'The property’s name', 0],
    ['Guests', `Up to ${d.maxGuests} · ${d.minNights}+ nights`, 1],
    [
      'Times',
      `In from ${formatTimeLabel(d.checkInTime)} · out by ${formatTimeLabel(d.checkOutTime)}`,
      1,
    ],
    ['Booking', d.instantBooking ? 'Instant' : 'You approve requests', 1],
    ['Amenities', d.amenities.length ? d.amenities.join(', ') : 'None ticked', 1],
    [
      'Price',
      `₦${naira(d.rate).toLocaleString('en-NG')} ${d.pricingMode === 'PER_NIGHT' ? 'per night' : 'per stay'}`,
      2,
    ],
    [
      'Extras',
      [
        naira(d.cleaning) ? `₦${naira(d.cleaning).toLocaleString('en-NG')} cleaning` : null,
        naira(d.deposit) ? `₦${naira(d.deposit).toLocaleString('en-NG')} deposit` : null,
        d.weekendUplift ? `+${d.weekendUplift}% weekends` : null,
      ]
        .filter(Boolean)
        .join(' · ') || 'None',
      2,
    ],
    ['Cancellation', CANCELLATION_POLICIES.find((p) => p.value === d.policy)!.label, 2],
  ];
  return (
    <Card elevated style={{ gap: spacing.md }}>
      {rows.map(([k, v, s]) => (
        <Pressable
          key={k}
          onPress={() => onJump(s)}
          accessibilityRole="button"
          accessibilityLabel={`${k}: ${v}. Change`}
          style={{ flexDirection: 'row', gap: spacing.md }}
        >
          <Text variant="callout" color="mutedForeground" style={{ width: 96 }}>
            {k}
          </Text>
          <Text variant="callout" style={{ flex: 1, fontWeight: '600' }}>
            {v}
          </Text>
        </Pressable>
      ))}
      <Text variant="caption" color="mutedForeground">
        Tap any line to change it. After publishing you can add photos, house rules, seasons and
        calendar sync.
      </Text>
    </Card>
  );
}

/* ---------------------------------- edit ---------------------------------- */

function EditForm({ listing }: { listing: HostListing }) {
  const { colors, spacing } = useTheme();
  const insets = useSafeAreaInsets();
  const qc = useQueryClient();
  const toast = useToast();
  const initial = useMemo(() => fromListing(listing), [listing]);
  const [d, setD] = useState<Draft>(initial);
  const patch = (p: Partial<Draft>) => setD((x) => ({ ...x, ...p }));
  const changed = JSON.stringify(d) !== JSON.stringify(initial);

  const save = useMutation({
    mutationFn: () =>
      hostShortletsApi.update(listing.id, {
        maxGuests: d.maxGuests,
        minNights: d.minNights,
        checkInTime: d.checkInTime,
        checkOutTime: d.checkOutTime,
        instantBooking: d.instantBooking,
        pricingMode: d.pricingMode,
        nightlyRate: naira(d.rate) || undefined,
        cleaningFee: naira(d.cleaning),
        deposit: naira(d.deposit),
        weekendUpliftPct: d.weekendUplift,
        cancellationPolicy: d.policy,
      }),
    onSuccess: () => {
      void haptics.success();
      qc.invalidateQueries({ queryKey: qk.host.listings });
      toast.show('Saved. New bookings use these settings.', 'success');
      router.back();
    },
    onError: () => void haptics.error(),
  });

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: colors.background }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
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
          eyebrow="Edit listing"
          title={listing.title}
          subtitle="Price and stay rules"
          onBack={() => router.back()}
        />
        <PriceStep d={d} patch={patch} />
        <StayStep d={d} patch={patch} />
        {save.error ? (
          <FormAlert
            message={
              save.error instanceof ApiError ? save.error.message : 'Could not save. Try again.'
            }
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
          label="Save changes"
          disabled={!changed || naira(d.rate) <= 0}
          loading={save.isPending}
          onPress={() => save.mutate()}
        />
      </View>
    </KeyboardAvoidingView>
  );
}

/* --------------------------------- pieces --------------------------------- */

function SwitchRow({
  label,
  hint,
  value,
  onChange,
}: {
  label: string;
  hint: string;
  value: boolean;
  onChange: (v: boolean) => void;
}) {
  const { colors, spacing } = useTheme();
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md, minHeight: 48 }}>
      <View style={{ flex: 1 }}>
        <Text variant="body">{label}</Text>
        <Text variant="caption" color="mutedForeground">
          {hint}
        </Text>
      </View>
      <Switch
        value={value}
        onValueChange={onChange}
        accessibilityLabel={label}
        trackColor={{ true: colors.primary, false: colors.border }}
      />
    </View>
  );
}

function PolicyOption({
  label,
  hint,
  selected,
  onPress,
}: {
  label: string;
  hint: string;
  selected: boolean;
  onPress: () => void;
}) {
  const { colors, spacing, radius } = useTheme();
  return (
    <Pressable
      onPress={() => {
        void haptics.tap();
        onPress();
      }}
      accessibilityRole="radio"
      accessibilityState={{ checked: selected }}
      accessibilityLabel={`${label}. ${hint}`}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.md,
        padding: spacing.md,
        borderRadius: radius.lg,
        borderWidth: selected ? 2 : 1,
        borderColor: selected ? colors.primary : colors.border,
        backgroundColor: colors.card,
      }}
    >
      <View style={{ flex: 1 }}>
        <Text variant="bodyStrong">{label}</Text>
        <Text variant="caption" color="mutedForeground">
          {hint}
        </Text>
      </View>
      {selected ? <Check size={18} color={colors.primary} /> : null}
    </Pressable>
  );
}
