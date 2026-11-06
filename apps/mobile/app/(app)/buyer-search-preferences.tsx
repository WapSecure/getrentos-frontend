import { useState } from 'react';
import { ScrollView, View } from 'react-native';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { X } from 'lucide-react-native';
import type { AddressValue } from '@getrentos/shared';
import {
  Button,
  Card,
  Chip,
  NumberField,
  QueryState,
  Skeleton,
  SwitchRow,
  Text,
  useTheme,
  useToast,
} from '@getrentos/ui-native';
import { qk } from '@/lib/query/keys';
import {
  buyerSettingsApi,
  type BuyerSearchPreferences as BuyerSearchPreferencesData,
} from '@/lib/api/buyerSettings';
import { errorMessage } from '@/lib/api/client';
import { DetailScreenHeader } from '@/components/dashboard/DetailScreenHeader';
import { goBack } from '@/lib/goBack';
import { AddressInput } from '@/components/forms/AddressInput';

const PROPERTY_TYPES = ['Apartment', 'House', 'Duplex', 'Bungalow', 'Land', 'Commercial'];

/** "Lekki, Ikoyi" as a list of areas. */
const splitAreas = (stored: string | null | undefined): string[] =>
  (stored ?? '')
    .split(',')
    .map((a) => a.trim())
    .filter(Boolean);

/** The list with `area` added once, whatever its case. */
const withArea = (areas: string[], area: string): string[] => {
  const a = area.trim();
  return !a || areas.some((x) => x.toLowerCase() === a.toLowerCase()) ? areas : [...areas, a];
};

export default function BuyerSearchPreferences() {
  const { colors, spacing } = useTheme();
  const query = useQuery({
    queryKey: qk.buyer.searchPreferences,
    queryFn: buyerSettingsApi.getSearchPreferences,
  });

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <DetailScreenHeader
        eyebrow="Property discovery"
        title="Search preferences"
        subtitle="Tune budgets, locations and match alerts"
        onBack={() => goBack()}
      />

      <QueryState
        query={query}
        skeleton={
          <View style={{ padding: spacing.xl, gap: spacing.md }}>
            <Skeleton height={260} radius={16} />
          </View>
        }
      >
        {query.data ? <SearchPreferencesForm data={query.data} /> : null}
      </QueryState>
    </View>
  );
}

function SearchPreferencesForm({ data }: { data: BuyerSearchPreferencesData }) {
  const { colors, spacing } = useTheme();
  const insets = useSafeAreaInsets();
  const qc = useQueryClient();
  const toast = useToast();

  // 0 means no limit, so it shows as an empty field rather than a typed "0".
  const [minBudget, setMinBudget] = useState(data.minBudget ? String(data.minBudget) : '');
  const [maxBudget, setMaxBudget] = useState(data.maxBudget ? String(data.maxBudget) : '');
  // Stored as one comma-separated string; edited as a list of areas.
  const [areas, setAreas] = useState<string[]>(() => splitAreas(data.preferredLocations));
  // What is in the search field: a typed area waits for "Add area"; a picked one is added at once.
  const [areaInput, setAreaInput] = useState<AddressValue | null>(null);
  const typedArea = areaInput && !areaInput.placeId ? areaInput.text.trim() : '';

  const addArea = (area: string) => {
    setAreas((prev) => withArea(prev, area));
    setAreaInput(null);
  };
  const [preferredTypes, setPreferredTypes] = useState<string[]>(data.preferredTypes ?? []);
  const [notifyOnMatch, setNotifyOnMatch] = useState(data.notifyOnMatch ?? true);

  const mutation = useMutation({
    mutationFn: () =>
      buyerSettingsApi.updateSearchPreferences({
        minBudget: Number(minBudget) || 0,
        maxBudget: Number(maxBudget) || 0,
        // An area typed but not yet added still counts.
        preferredLocations: withArea(areas, typedArea).join(', '),
        preferredTypes,
        notifyOnMatch,
      }),
    onSuccess: (updated) => {
      qc.setQueryData(qk.buyer.searchPreferences, updated);
      toast.show('Search preferences saved.', 'success');
    },
    onError: (err) => toast.show(errorMessage(err, 'Could not save these preferences.'), 'error'),
  });

  const toggleType = (t: string) => {
    setPreferredTypes((prev) => (prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t]));
  };

  return (
    <ScrollView
      keyboardShouldPersistTaps="handled"
      contentContainerStyle={{
        padding: spacing.xl,
        paddingBottom: insets.bottom + spacing['3xl'],
        gap: spacing.lg,
      }}
    >
      <Card elevated style={{ gap: spacing.md }}>
        <View style={{ flexDirection: 'row', gap: spacing.md }}>
          <View style={{ flex: 1 }}>
            <NumberField
              label="Min budget"
              value={minBudget}
              onValueChange={setMinBudget}
              placeholder="No minimum"
              currency
            />
          </View>
          <View style={{ flex: 1 }}>
            <NumberField
              label="Max budget"
              value={maxBudget}
              onValueChange={setMaxBudget}
              placeholder="No maximum"
              currency
            />
          </View>
        </View>
        <View style={{ gap: spacing.sm }}>
          <AddressInput
            label="Preferred locations"
            kind="area"
            allowManual
            placeholder="e.g. Lekki, Ikoyi"
            hint="Pick an area from the suggestions to add it. If it is not listed, add it as typed."
            value={areaInput}
            onChange={(next) => {
              if (next?.verified) addArea(next.verified.line1);
              else setAreaInput(next);
            }}
          />
          {typedArea ? (
            <Button
              label={`Add “${typedArea}”`}
              variant="secondary"
              size="sm"
              fullWidth={false}
              onPress={() => addArea(typedArea)}
            />
          ) : null}
          {areas.length ? (
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>
              {areas.map((a) => (
                <Chip
                  key={a}
                  label={a}
                  size="sm"
                  selected
                  leadingIcon={<X size={12} color={colors.accentForeground} />}
                  onPress={() => setAreas((prev) => prev.filter((x) => x !== a))}
                />
              ))}
            </View>
          ) : null}
          {areas.length ? (
            <Text variant="caption" color="mutedForeground">
              Tap an area to remove it.
            </Text>
          ) : null}
        </View>
      </Card>

      <View style={{ gap: spacing.sm }}>
        <Text variant="bodyStrong">Property types</Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>
          {PROPERTY_TYPES.map((t) => (
            <Chip
              key={t}
              label={t}
              size="sm"
              selected={preferredTypes.includes(t)}
              onPress={() => toggleType(t)}
            />
          ))}
        </View>
      </View>

      <Card elevated>
        <SwitchRow
          label="Notify me on match"
          description="Get alerted when a new listing matches these preferences."
          value={notifyOnMatch}
          onValueChange={setNotifyOnMatch}
        />
      </Card>

      <Button label="Save" loading={mutation.isPending} onPress={() => mutation.mutate()} />
    </ScrollView>
  );
}
