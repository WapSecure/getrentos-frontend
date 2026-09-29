import { useState } from 'react';
import { View } from 'react-native';
import { Button, Chip, SegmentedControl, Text, TextField, useTheme } from '@getrentos/ui-native';
import { Sheet } from '@/components/Sheet';
import { Stepper } from '@/components/host/HostUI';
import { AMENITIES } from '@/lib/api/hostShortlets';
import type { ShortletFilters, ShortletSort } from '@/lib/api/shortlets';

/** The refinements the filter sheet owns (search text and dates live on the screen). */
export type StayRefinements = Pick<
  ShortletFilters,
  | 'minPrice'
  | 'maxPrice'
  | 'bedrooms'
  | 'instantBooking'
  | 'verifiedOnly'
  | 'power24h'
  | 'petsAllowed'
  | 'amenities'
  | 'sort'
>;

export const QUICK_TOGGLES: {
  key: 'instantBooking' | 'verifiedOnly' | 'power24h' | 'petsAllowed';
  label: string;
}[] = [
  { key: 'power24h', label: '24-hour power' },
  { key: 'instantBooking', label: 'Instant book' },
  { key: 'verifiedOnly', label: 'Verified hosts' },
  { key: 'petsAllowed', label: 'Pets allowed' },
];

/** How many refinements are active, for the Filters chip count. */
export function refinementCount(r: StayRefinements): number {
  return (
    (r.minPrice ? 1 : 0) +
    (r.maxPrice ? 1 : 0) +
    (r.bedrooms ? 1 : 0) +
    QUICK_TOGGLES.filter((t) => r[t.key]).length +
    (r.amenities?.length ?? 0) +
    (r.sort && r.sort !== 'newest' ? 1 : 0)
  );
}

const SORTS: { value: ShortletSort; label: string }[] = [
  { value: 'newest', label: 'Newest' },
  { value: 'price_asc', label: 'Lowest price' },
  { value: 'price_desc', label: 'Highest price' },
];

const toNumber = (s: string) => {
  const n = Number(s.replace(/[^\d]/g, ''));
  return n > 0 ? n : undefined;
};

export function StayFiltersSheet(props: {
  open: boolean;
  onClose: () => void;
  value: StayRefinements;
  onApply: (next: StayRefinements) => void;
}) {
  return <Form key={props.open ? 'open' : 'closed'} {...props} />;
}

function Form({
  open,
  onClose,
  value,
  onApply,
}: {
  open: boolean;
  onClose: () => void;
  value: StayRefinements;
  onApply: (next: StayRefinements) => void;
}) {
  const { spacing } = useTheme();
  const [draft, setDraft] = useState<StayRefinements>(value);
  const [minText, setMinText] = useState(value.minPrice ? String(value.minPrice) : '');
  const [maxText, setMaxText] = useState(value.maxPrice ? String(value.maxPrice) : '');
  const set = (patch: Partial<StayRefinements>) => setDraft((d) => ({ ...d, ...patch }));
  const min = toNumber(minText);
  const max = toNumber(maxText);
  const badRange = !!min && !!max && min > max;

  const footer = (
    <View style={{ flexDirection: 'row', gap: spacing.sm }}>
      <Button
        label="Reset"
        variant="ghost"
        fullWidth={false}
        onPress={() => {
          setDraft({});
          setMinText('');
          setMaxText('');
        }}
      />
      <Button
        label="Show stays"
        style={{ flex: 1 }}
        disabled={badRange}
        onPress={() => {
          onApply({ ...draft, minPrice: min, maxPrice: max });
          onClose();
        }}
      />
    </View>
  );

  return (
    <Sheet open={open} onClose={onClose} title="Filters" snapPoints={['88%']} footer={footer}>
      <View style={{ gap: spacing['2xl'], paddingBottom: spacing.md }}>
        <View style={{ gap: spacing.sm }}>
          <Text variant="subheading">Sort by</Text>
          <SegmentedControl
            accessibilityLabel="Sort stays"
            options={SORTS}
            value={draft.sort ?? 'newest'}
            onChange={(sort) => set({ sort })}
          />
        </View>

        <View style={{ gap: spacing.sm }}>
          <Text variant="subheading">Nightly price</Text>
          <View style={{ flexDirection: 'row', gap: spacing.sm }}>
            <TextField
              label="Minimum (₦)"
              value={minText}
              onChangeText={setMinText}
              keyboardType="number-pad"
              placeholder="Any"
              containerStyle={{ flex: 1 }}
            />
            <TextField
              label="Maximum (₦)"
              value={maxText}
              onChangeText={setMaxText}
              keyboardType="number-pad"
              placeholder="Any"
              containerStyle={{ flex: 1 }}
              error={badRange ? 'Below the minimum' : undefined}
            />
          </View>
        </View>

        <Stepper
          label="Bedrooms"
          hint={draft.bedrooms ? `${draft.bedrooms}+ bedrooms` : 'Any number'}
          value={draft.bedrooms ?? 0}
          min={0}
          max={10}
          onChange={(n) => set({ bedrooms: n || undefined })}
        />

        <View style={{ gap: spacing.sm }}>
          <Text variant="subheading">Must have</Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>
            {QUICK_TOGGLES.map((t) => (
              <Chip
                key={t.key}
                label={t.label}
                selected={!!draft[t.key]}
                onPress={() => set({ [t.key]: !draft[t.key] || undefined })}
              />
            ))}
          </View>
        </View>

        <View style={{ gap: spacing.sm }}>
          <Text variant="subheading">Amenities</Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>
            {AMENITIES.map((a) => {
              const on = draft.amenities?.includes(a) ?? false;
              return (
                <Chip
                  key={a}
                  label={a}
                  selected={on}
                  onPress={() =>
                    set({
                      amenities: on
                        ? draft.amenities?.filter((x) => x !== a)
                        : [...(draft.amenities ?? []), a],
                    })
                  }
                />
              );
            })}
          </View>
        </View>
      </View>
    </Sheet>
  );
}
