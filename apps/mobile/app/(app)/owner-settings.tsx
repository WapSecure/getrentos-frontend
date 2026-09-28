import { useState } from 'react';
import { ScrollView, Switch, View } from 'react-native';
import { router } from 'expo-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  Button,
  Card,
  Chip,
  ErrorState,
  Skeleton,
  Text,
  useTheme,
  useToast,
} from '@getrentos/ui-native';
import { qk } from '@/lib/query/keys';
import { ownerApi, type OwnerPreferences } from '@/lib/api/owner';
import { ApiError } from '@/lib/api/client';
import { DetailHeader } from '@/components/dashboard/DetailHeader';

const FLOORS = [50, 70, 80, 90];

export default function OwnerSettings() {
  const { colors, spacing, radius } = useTheme();
  const insets = useSafeAreaInsets();
  const query = useQuery({ queryKey: qk.owner.preferences, queryFn: ownerApi.preferences });

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.background }}
      contentContainerStyle={{
        paddingTop: insets.top + spacing.md,
        paddingHorizontal: spacing.xl,
        paddingBottom: insets.bottom + spacing['3xl'],
        gap: spacing.lg,
      }}
    >
      <DetailHeader
        eyebrow="Settings"
        title="Selling preferences"
        subtitle="How offers reach you"
        onBack={() => router.back()}
      />
      {query.isError && !query.data ? (
        <ErrorState onRetry={() => query.refetch()} />
      ) : !query.data ? (
        <Skeleton height={220} radius={radius.lg} />
      ) : (
        <Form key={JSON.stringify(query.data)} initial={query.data} />
      )}
    </ScrollView>
  );
}

function Form({ initial }: { initial: OwnerPreferences }) {
  const { colors, spacing } = useTheme();
  const qc = useQueryClient();
  const toast = useToast();
  const [prefs, setPrefs] = useState(initial);
  const changed = JSON.stringify(prefs) !== JSON.stringify(initial);

  const save = useMutation({
    mutationFn: () => ownerApi.updatePreferences(prefs),
    onSuccess: (saved) => {
      qc.setQueryData(qk.owner.preferences, saved);
      toast.show('Preferences saved.', 'success');
    },
    onError: (err) =>
      toast.show(
        err instanceof ApiError ? err.message : 'Could not save your preferences.',
        'error'
      ),
  });

  return (
    <>
      <Card elevated style={{ gap: spacing.md }}>
        <Text variant="bodyStrong" accessibilityRole="header">
          Lowest offer you want to see
        </Text>
        <Text variant="caption" color="mutedForeground">
          As a share of your asking price.
        </Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>
          {FLOORS.map((f) => (
            <Chip
              key={f}
              label={`${f}%`}
              selected={prefs.minOfferPercent === f}
              disabled={save.isPending}
              onPress={() => setPrefs((p) => ({ ...p, minOfferPercent: f }))}
            />
          ))}
        </View>
        <Row
          label="Decline offers below that automatically"
          value={prefs.autoDeclineLowOffers}
          disabled={save.isPending}
          onChange={(v) => setPrefs((p) => ({ ...p, autoDeclineLowOffers: v }))}
        />
      </Card>
      <Card elevated>
        <Row
          label="Open to renting the property out instead"
          hint="Buyers and agents may suggest a rental arrangement."
          value={prefs.allowRentalConversion}
          disabled={save.isPending}
          onChange={(v) => setPrefs((p) => ({ ...p, allowRentalConversion: v }))}
        />
      </Card>
      <Button
        label="Save preferences"
        disabled={!changed}
        loading={save.isPending}
        onPress={() => save.mutate()}
      />
      <Text
        variant="caption"
        color="mutedForeground"
        center
        style={{ color: colors.mutedForeground }}
      >
        Password, two-factor and payout settings are on the web dashboard for now.
      </Text>
    </>
  );
}

function Row({
  label,
  hint,
  value,
  disabled = false,
  onChange,
}: {
  label: string;
  hint?: string;
  value: boolean;
  disabled?: boolean;
  onChange: (v: boolean) => void;
}) {
  const { colors, spacing } = useTheme();
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md, minHeight: 44 }}>
      <View style={{ flex: 1 }}>
        <Text variant="callout">{label}</Text>
        {hint ? (
          <Text variant="caption" color="mutedForeground">
            {hint}
          </Text>
        ) : null}
      </View>
      <Switch
        value={value}
        onValueChange={onChange}
        disabled={disabled}
        accessibilityLabel={label}
        accessibilityState={{ disabled }}
        trackColor={{ true: colors.primary, false: colors.border }}
      />
    </View>
  );
}
