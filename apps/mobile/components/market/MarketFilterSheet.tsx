import { useState, type ReactNode } from 'react';
import { ScrollView, View } from 'react-native';
import { Button, Checkbox, Chip, Text, TextField, useTheme } from '@getrentos/ui-native';
import { Sheet } from '@/components/Sheet';
import {
  activeFilterCount,
  MARKET_FILTERS,
  type MarketFilters,
  type MarketKind,
} from '@/lib/api/publicMarket';
import { LAND_TITLE_TYPE_LABEL } from '@/lib/api/land';

/** The refinements a filter sheet edits — everything except search, sort and estate scope. */
export type MarketRefinements = Omit<MarketFilters, 'search' | 'sort' | 'estate'>;

const PROPERTY_TYPES: { value: string; label: string }[] = [
  { value: 'APARTMENT', label: 'Apartment' },
  { value: 'DUPLEX', label: 'Duplex' },
  { value: 'CONDO', label: 'Condo' },
  { value: 'SHARED_APARTMENT', label: 'Shared' },
  { value: 'COMMERCIAL', label: 'Commercial' },
];

/** Square metres; a standard Lagos plot is roughly 450–650 sqm. */
const AREAS: { value: number; label: string }[] = [
  { value: 450, label: '1 plot+' },
  { value: 900, label: '2 plots+' },
  { value: 4047, label: '1 acre+' },
  { value: 10_000, label: '1 hectare+' },
];

const TITLE_TYPES = (
  [
    'CERTIFICATE_OF_OCCUPANCY',
    'GOVERNOR_CONSENT',
    'DEED_OF_ASSIGNMENT',
    'REGISTERED_CONVEYANCE',
    'EXCISION_GAZETTE',
    'SURVEY_PLAN',
  ] as const
).map((value) => ({ value, label: LAND_TITLE_TYPE_LABEL[value] }));

export function MarketFilterSheet({
  open,
  kind,
  value,
  onClose,
  onApply,
}: {
  open: boolean;
  kind: MarketKind;
  value: MarketRefinements;
  onClose: () => void;
  onApply: (next: MarketRefinements) => void;
}) {
  const { spacing } = useTheme();
  const [draft, setDraft] = useState<MarketRefinements>(value);
  // Start from the applied filters each time the sheet opens (adjusting state
  // on a prop change during render, not in an effect).
  const [wasOpen, setWasOpen] = useState(open);
  if (open !== wasOpen) {
    setWasOpen(open);
    if (open) setDraft(value);
  }

  const allowed = new Set(MARKET_FILTERS[kind]);
  const set = <K extends keyof MarketRefinements>(key: K, v: MarketRefinements[K]) =>
    setDraft((d) => ({ ...d, [key]: v }));
  const toggle = <K extends keyof MarketRefinements>(key: K, v: MarketRefinements[K]) =>
    setDraft((d) => ({ ...d, [key]: d[key] === v ? undefined : v }));

  const count = activeFilterCount(kind, draft);

  return (
    <Sheet
      open={open}
      onClose={onClose}
      title="Filters"
      snapPoints={['85%']}
      footer={
        <View style={{ flexDirection: 'row', gap: spacing.sm }}>
          <Button
            label="Reset"
            variant="outline"
            fullWidth={false}
            disabled={count === 0}
            onPress={() => setDraft({})}
          />
          <View style={{ flex: 1 }}>
            <Button
              label={count ? `Apply ${count} filter${count === 1 ? '' : 's'}` : 'Show results'}
              onPress={() => {
                onApply(draft);
                onClose();
              }}
            />
          </View>
        </View>
      }
    >
      <ScrollView
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ gap: spacing.xl, paddingBottom: spacing.xl }}
      >
        <Section title={kind === 'shortlet' ? 'Price per night' : 'Price'}>
          <View style={{ flexDirection: 'row', gap: spacing.sm }}>
            <View style={{ flex: 1 }}>
              <NairaField
                label="Minimum"
                value={draft.minPrice}
                onChange={(v) => set('minPrice', v)}
              />
            </View>
            <View style={{ flex: 1 }}>
              <NairaField
                label="Maximum"
                value={draft.maxPrice}
                onChange={(v) => set('maxPrice', v)}
              />
            </View>
          </View>
        </Section>

        {allowed.has('guests') ? (
          <Section title="Guests">
            <ChipRow>
              {[1, 2, 3, 4, 6, 8].map((n) => (
                <Chip
                  key={n}
                  label={`${n}+`}
                  selected={draft.guests === n}
                  onPress={() => toggle('guests', n)}
                />
              ))}
            </ChipRow>
          </Section>
        ) : null}

        {allowed.has('bedrooms') ? (
          <Section title="Bedrooms">
            <ChipRow>
              {[1, 2, 3, 4, 5].map((n) => (
                <Chip
                  key={n}
                  label={`${n}+`}
                  selected={draft.bedrooms === n}
                  onPress={() => toggle('bedrooms', n)}
                />
              ))}
            </ChipRow>
          </Section>
        ) : null}

        {allowed.has('bathrooms') ? (
          <Section title="Bathrooms">
            <ChipRow>
              {[1, 2, 3, 4].map((n) => (
                <Chip
                  key={n}
                  label={`${n}+`}
                  selected={draft.bathrooms === n}
                  onPress={() => toggle('bathrooms', n)}
                />
              ))}
            </ChipRow>
          </Section>
        ) : null}

        {allowed.has('propertyType') ? (
          <Section title="Property type">
            <ChipRow>
              {PROPERTY_TYPES.map((t) => (
                <Chip
                  key={t.value}
                  label={t.label}
                  selected={draft.propertyType === t.value}
                  onPress={() => toggle('propertyType', t.value)}
                />
              ))}
            </ChipRow>
          </Section>
        ) : null}

        {allowed.has('titleType') ? (
          <Section title="Title document">
            <ChipRow>
              {TITLE_TYPES.map((t) => (
                <Chip
                  key={t.value}
                  label={t.label}
                  selected={draft.titleType === t.value}
                  onPress={() => toggle('titleType', t.value)}
                />
              ))}
            </ChipRow>
          </Section>
        ) : null}

        {allowed.has('minAreaSqm') ? (
          <Section title="Plot size">
            <ChipRow>
              {AREAS.map((a) => (
                <Chip
                  key={a.value}
                  label={a.label}
                  selected={draft.minAreaSqm === a.value}
                  onPress={() => toggle('minAreaSqm', a.value)}
                />
              ))}
            </ChipRow>
          </Section>
        ) : null}

        <Section title="Must have">
          <View>
            {allowed.has('verifiedOnly') ? (
              <Checkbox
                label="Verified properties only"
                checked={!!draft.verifiedOnly}
                onChange={(v) => set('verifiedOnly', v || undefined)}
              />
            ) : null}
            {allowed.has('instantBooking') ? (
              <Checkbox
                label="Instant booking"
                checked={!!draft.instantBooking}
                onChange={(v) => set('instantBooking', v || undefined)}
              />
            ) : null}
            {allowed.has('furnished') ? (
              <Checkbox
                label="Furnished"
                checked={!!draft.furnished}
                onChange={(v) => set('furnished', v || undefined)}
              />
            ) : null}
            {allowed.has('petsAllowed') ? (
              <Checkbox
                label="Pets allowed"
                checked={!!draft.petsAllowed}
                onChange={(v) => set('petsAllowed', v || undefined)}
              />
            ) : null}
            {allowed.has('monthlyPayment') ? (
              <Checkbox
                label="Rent can be paid monthly"
                checked={!!draft.monthlyPayment}
                onChange={(v) => set('monthlyPayment', v || undefined)}
              />
            ) : null}
            {allowed.has('roadAccess') ? (
              <Checkbox
                label="Road access"
                checked={!!draft.roadAccess}
                onChange={(v) => set('roadAccess', v || undefined)}
              />
            ) : null}
          </View>
        </Section>
      </ScrollView>
    </Sheet>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  const { spacing } = useTheme();
  return (
    <View style={{ gap: spacing.sm }}>
      <Text variant="bodyStrong" accessibilityRole="header">
        {title}
      </Text>
      {children}
    </View>
  );
}

function ChipRow({ children }: { children: ReactNode }) {
  return <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>{children}</View>;
}

/** A whole-naira amount; empty means "no bound". */
function NairaField({
  label,
  value,
  onChange,
}: {
  label: string;
  value?: number;
  onChange: (v: number | undefined) => void;
}) {
  return (
    <TextField
      label={label}
      placeholder="₦ Any"
      keyboardType="number-pad"
      value={value ? value.toLocaleString('en-NG') : ''}
      onChangeText={(t) => {
        const digits = t.replace(/\D/g, '');
        onChange(digits ? Number(digits) : undefined);
      }}
    />
  );
}
