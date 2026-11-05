import { useState } from 'react';
import { ScrollView, View } from 'react-native';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  Button,
  Chip,
  NumberField,
  QueryState,
  Skeleton,
  Text,
  useTheme,
  useToast,
} from '@getrentos/ui-native';
import { qk } from '@/lib/query/keys';
import {
  commissionRateOk,
  PREFERRED_PROPERTY_TYPES,
  realtorApi,
  SERVICE_AREA_OPTIONS,
  type RealtorBusinessPreferences,
} from '@/lib/api/realtor';
import { errorMessage } from '@/lib/api/client';
import { DetailScreenHeader } from '@/components/dashboard/DetailScreenHeader';
import { goBack } from '@/lib/goBack';

/** Defaults used across a realtor's listings and deals (web: BusinessPreferencesSettings). */
export default function RealtorPreferences() {
  const { colors, spacing } = useTheme();
  const insets = useSafeAreaInsets();
  const q = useQuery({
    queryKey: qk.realtor.businessPreferences,
    queryFn: realtorApi.businessPreferences,
  });
  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <DetailScreenHeader
        eyebrow="Settings"
        title="Business preferences"
        subtitle="Defaults for your listings and deals"
        onBack={() => goBack()}
      />
      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: spacing.xl,
          paddingBottom: insets.bottom + spacing['3xl'],
          gap: spacing.lg,
        }}
        keyboardShouldPersistTaps="handled"
      >
        <QueryState query={q} skeleton={<Skeleton height={260} />}>
          {q.data ? <PreferencesForm initial={q.data} /> : null}
        </QueryState>
      </ScrollView>
    </View>
  );
}

const toggle = (list: string[], v: string) =>
  list.includes(v) ? list.filter((x) => x !== v) : [...list, v];

function PreferencesForm({ initial }: { initial: RealtorBusinessPreferences }) {
  const { spacing } = useTheme();
  const qc = useQueryClient();
  const toast = useToast();
  const [rate, setRate] = useState(String(initial.commissionRate ?? 5));
  const [areas, setAreas] = useState<string[]>(initial.serviceAreas ?? []);
  const [types, setTypes] = useState<string[]>(initial.propertyTypes ?? []);
  const rateNumber = Number(rate);
  const save = useMutation({
    mutationFn: () =>
      realtorApi.updateBusinessPreferences({
        commissionRate: rateNumber,
        serviceAreas: areas,
        propertyTypes: types,
      }),
    onSuccess: (saved) => {
      qc.setQueryData(qk.realtor.businessPreferences, saved);
      qc.invalidateQueries({ queryKey: qk.realtor.businessPreferences });
      toast.show('Preferences saved.', 'success');
    },
    onError: (e) => toast.show(errorMessage(e, 'Could not save your preferences.'), 'error'),
  });
  return (
    <View style={{ gap: spacing.lg }}>
      <NumberField
        label="Default commission rate (%)"
        value={rate}
        onValueChange={setRate}
        decimals={2}
        hint="A whole number between 1 and 100."
        error={
          rate && !commissionRateOk(rateNumber) ? 'Use a whole number between 1 and 100.' : null
        }
      />
      <View style={{ gap: spacing.sm }}>
        <Text variant="callout" color="mutedForeground" style={{ fontWeight: '600' }}>
          Areas you serve
        </Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>
          {SERVICE_AREA_OPTIONS.map((a) => (
            <Chip
              key={a}
              label={a}
              selected={areas.includes(a)}
              onPress={() => setAreas((x) => toggle(x, a))}
            />
          ))}
        </View>
      </View>
      <View style={{ gap: spacing.sm }}>
        <Text variant="callout" color="mutedForeground" style={{ fontWeight: '600' }}>
          Property types you handle
        </Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>
          {PREFERRED_PROPERTY_TYPES.map((t) => (
            <Chip
              key={t.value}
              label={t.label}
              selected={types.includes(t.value)}
              onPress={() => setTypes((x) => toggle(x, t.value))}
            />
          ))}
        </View>
      </View>
      <Button
        label="Save preferences"
        loading={save.isPending}
        disabled={!commissionRateOk(rateNumber) || save.isPending}
        onPress={() => save.mutate()}
      />
    </View>
  );
}
