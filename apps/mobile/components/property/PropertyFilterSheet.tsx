import { useState } from 'react';
import { View } from 'react-native';
import { Check } from 'lucide-react-native';
import { Button, Chip, Text, TextField, useTheme } from '@getrentos/ui-native';
import { Sheet } from '@/components/Sheet';
import {
  PROPERTY_TYPES,
  PROPERTY_TYPE_LABEL,
  type ListingFilters,
  type PropertyType,
} from '@/lib/api/properties';

interface Props {
  open: boolean;
  onClose: () => void;
  value: ListingFilters;
  onApply: (filters: ListingFilters) => void;
}

const BED_OPTIONS = [1, 2, 3, 4] as const;
const BATH_OPTIONS = [1, 2, 3] as const;

const parseAmount = (s: string): number | undefined => {
  const n = Number(s.replace(/[^\d]/g, ''));
  return Number.isFinite(n) && n > 0 ? n : undefined;
};

export function PropertyFilterSheet({ open, onClose, value, onApply }: Props) {
  return (
    <Sheet open={open} onClose={onClose} title="Filters">
      {/* Remount on each open so the draft seeds cleanly from the live filters. */}
      <FilterForm
        key={open ? 'open' : 'closed'}
        value={value}
        onApply={onApply}
        onClose={onClose}
      />
    </Sheet>
  );
}

function FilterForm({
  value,
  onApply,
  onClose,
}: {
  value: ListingFilters;
  onApply: (f: ListingFilters) => void;
  onClose: () => void;
}) {
  const { colors, spacing } = useTheme();
  const [draft, setDraft] = useState<ListingFilters>(value);
  const [minStr, setMinStr] = useState(value.minPrice ? String(value.minPrice) : '');
  const [maxStr, setMaxStr] = useState(value.maxPrice ? String(value.maxPrice) : '');

  const set = <K extends keyof ListingFilters>(key: K, v: ListingFilters[K]) =>
    setDraft((d) => ({ ...d, [key]: v }));

  const reset = () => {
    setDraft({ search: value.search });
    setMinStr('');
    setMaxStr('');
  };

  const apply = () => {
    onApply({
      ...draft,
      search: value.search,
      minPrice: parseAmount(minStr),
      maxPrice: parseAmount(maxStr),
    });
    onClose();
  };

  const activeCount =
    (parseAmount(minStr) ? 1 : 0) +
    (parseAmount(maxStr) ? 1 : 0) +
    (draft.bedrooms ? 1 : 0) +
    (draft.bathrooms ? 1 : 0) +
    (draft.propertyType ? 1 : 0) +
    (draft.verifiedOnly ? 1 : 0);

  return (
    <View style={{ gap: spacing.xl }}>
      <Field label="Price range (₦ / month)">
        <View style={{ flexDirection: 'row', gap: spacing.md }}>
          <View style={{ flex: 1 }}>
            <TextField
              placeholder="Min"
              keyboardType="number-pad"
              value={minStr}
              onChangeText={setMinStr}
            />
          </View>
          <View style={{ flex: 1 }}>
            <TextField
              placeholder="Max"
              keyboardType="number-pad"
              value={maxStr}
              onChangeText={setMaxStr}
            />
          </View>
        </View>
      </Field>

      <Field label="Bedrooms">
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>
          <Chip label="Any" selected={!draft.bedrooms} onPress={() => set('bedrooms', undefined)} />
          {BED_OPTIONS.map((n) => (
            <Chip
              key={n}
              label={n === 4 ? '4+' : String(n)}
              selected={draft.bedrooms === n}
              onPress={() => set('bedrooms', n)}
            />
          ))}
        </View>
      </Field>

      <Field label="Bathrooms">
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>
          <Chip
            label="Any"
            selected={!draft.bathrooms}
            onPress={() => set('bathrooms', undefined)}
          />
          {BATH_OPTIONS.map((n) => (
            <Chip
              key={n}
              label={n === 3 ? '3+' : String(n)}
              selected={draft.bathrooms === n}
              onPress={() => set('bathrooms', n)}
            />
          ))}
        </View>
      </Field>

      <Field label="Property type">
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>
          <Chip
            label="Any"
            selected={!draft.propertyType}
            onPress={() => set('propertyType', undefined)}
          />
          {PROPERTY_TYPES.map((t: PropertyType) => (
            <Chip
              key={t}
              label={PROPERTY_TYPE_LABEL[t]}
              selected={draft.propertyType === t}
              onPress={() => set('propertyType', t)}
            />
          ))}
        </View>
      </Field>

      <Chip
        label="Verified listings only"
        selected={!!draft.verifiedOnly}
        onPress={() => set('verifiedOnly', !draft.verifiedOnly)}
        leadingIcon={
          draft.verifiedOnly ? <Check size={14} color={colors.accentForeground} /> : undefined
        }
      />

      <View style={{ flexDirection: 'row', gap: spacing.md, marginTop: spacing.sm }}>
        <View style={{ flex: 1 }}>
          <Button label="Reset" variant="secondary" onPress={reset} />
        </View>
        <View style={{ flex: 2 }}>
          <Button
            label={activeCount ? `Show results · ${activeCount}` : 'Show results'}
            onPress={apply}
          />
        </View>
      </View>
    </View>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  const { spacing } = useTheme();
  return (
    <View style={{ gap: spacing.sm }}>
      <Text variant="callout" color="mutedForeground" style={{ fontWeight: '600' }}>
        {label}
      </Text>
      {children}
    </View>
  );
}
