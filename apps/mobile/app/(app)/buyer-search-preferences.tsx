import { useState } from 'react';
import { ScrollView, View } from 'react-native';
import { router } from 'expo-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  Button,
  Card,
  Chip,
  ErrorState,
  NumberField,
  Skeleton,
  SwitchRow,
  Text,
  TextField,
  useTheme,
  useToast,
} from '@getrentos/ui-native';
import { qk } from '@/lib/query/keys';
import {
  buyerSettingsApi,
  type BuyerSearchPreferences as BuyerSearchPreferencesData,
} from '@/lib/api/buyerSettings';
import { ApiError } from '@/lib/api/client';
import { DetailScreenHeader } from '@/components/dashboard/DetailScreenHeader';

const PROPERTY_TYPES = ['Apartment', 'House', 'Duplex', 'Bungalow', 'Land', 'Commercial'];

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
        onBack={() => router.back()}
      />

      {query.data ? (
        <SearchPreferencesForm data={query.data} />
      ) : query.isLoading ? (
        <View style={{ padding: spacing.xl, gap: spacing.md }}>
          <Skeleton height={260} radius={16} />
        </View>
      ) : (
        <ErrorState onRetry={() => query.refetch()} />
      )}
    </View>
  );
}

function SearchPreferencesForm({ data }: { data: BuyerSearchPreferencesData }) {
  const { spacing } = useTheme();
  const insets = useSafeAreaInsets();
  const qc = useQueryClient();
  const toast = useToast();

  const [minBudget, setMinBudget] = useState(String(data.minBudget ?? ''));
  const [maxBudget, setMaxBudget] = useState(String(data.maxBudget ?? ''));
  const [preferredLocations, setPreferredLocations] = useState(data.preferredLocations ?? '');
  const [preferredTypes, setPreferredTypes] = useState<string[]>(data.preferredTypes ?? []);
  const [notifyOnMatch, setNotifyOnMatch] = useState(data.notifyOnMatch ?? true);

  const mutation = useMutation({
    mutationFn: () =>
      buyerSettingsApi.updateSearchPreferences({
        minBudget: Number(minBudget) || 0,
        maxBudget: Number(maxBudget) || 0,
        preferredLocations: preferredLocations.trim(),
        preferredTypes,
        notifyOnMatch,
      }),
    onSuccess: (updated) => {
      qc.setQueryData(qk.buyer.searchPreferences, updated);
      toast.show('Search preferences saved.', 'success');
    },
    onError: (err) =>
      toast.show(
        err instanceof ApiError ? err.message : 'Could not save these preferences.',
        'error'
      ),
  });

  const toggleType = (t: string) => {
    setPreferredTypes((prev) => (prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t]));
  };

  return (
    <ScrollView
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
              currency
            />
          </View>
          <View style={{ flex: 1 }}>
            <NumberField
              label="Max budget"
              value={maxBudget}
              onValueChange={setMaxBudget}
              currency
            />
          </View>
        </View>
        <TextField
          label="Preferred locations"
          placeholder="e.g. Lekki, Ikoyi"
          value={preferredLocations}
          onChangeText={setPreferredLocations}
        />
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
