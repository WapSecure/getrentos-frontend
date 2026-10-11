import { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, View } from 'react-native';
import { router } from 'expo-router';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Building2 } from 'lucide-react-native';
import {
  Button,
  Card,
  Chip,
  FormAlert,
  Text,
  TextField,
  useTheme,
  useToast,
} from '@getrentos/ui-native';
import { DetailHeader } from '@/components/dashboard/DetailHeader';
import { errorText } from '@/components/estate/EstateUI';
import { SelectField } from '@/components/forms/SelectField';
import { useEstate } from '@/hooks/useEstate';
import { isFreeEstate } from '@/lib/api/estateManager';
import {
  MAX_GATES,
  estateStaffSetupApi,
  isPlanLimitError,
  validateEstateDraft,
  type EstateDraft,
  type EstateDraftErrors,
} from '@/lib/api/estateStaffSetup';
import { getCitiesFor, NIGERIA_STATE_CITIES } from '@/lib/locationCities';
import { haptics } from '@/lib/haptics';
import { qk } from '@/lib/query/keys';

const STATE_OPTIONS = Object.keys(NIGERIA_STATE_CITIES).map((s) => ({ value: s, label: s }));

/**
 * Set up an estate: its name, where it is and how many gates it has. The first
 * one is free on every plan; another one is Pro, and the API says so.
 */
export default function EstateSetup() {
  const { colors, spacing, radius } = useTheme();
  const insets = useSafeAreaInsets();
  const qc = useQueryClient();
  const toast = useToast();
  const { estates, select } = useEstate();
  const [draft, setDraft] = useState<EstateDraft>({
    name: '',
    address: '',
    city: '',
    state: '',
    gateCount: '1',
  });
  const [errors, setErrors] = useState<EstateDraftErrors>({});
  const another = estates.length > 0;
  const onFree = another && estates.some((e) => isFreeEstate(e));
  const cities = getCitiesFor('Nigeria', draft.state);

  const set = (field: keyof EstateDraft) => (value: string) => {
    setDraft((d) => ({ ...d, [field]: value }));
    if (errors[field]) setErrors((e) => ({ ...e, [field]: undefined }));
  };

  const create = useMutation({
    mutationFn: estateStaffSetupApi.createEstate,
    onSuccess: (estate) => {
      void haptics.success();
      select(estate.id);
      qc.invalidateQueries({ queryKey: qk.estateManager.estates });
      toast.show(`${estate.name} is set up. Add your households next.`, 'success');
      if (router.canGoBack()) router.back();
      else router.replace('/(app)/(estate)');
    },
    onError: () => void haptics.error(),
  });

  const submit = () => {
    const checked = validateEstateDraft(draft);
    if (!checked.ok) {
      setErrors(checked.errors);
      void haptics.error();
      return;
    }
    setErrors({});
    create.mutate(checked.body);
  };

  const filled =
    !!draft.name.trim() && !!draft.address.trim() && !!draft.city.trim() && !!draft.state;
  const planBlocked = create.error && isPlanLimitError(create.error);

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
          paddingBottom: insets.bottom + spacing['3xl'],
          gap: spacing.lg,
        }}
      >
        <DetailHeader
          eyebrow="Estate office"
          title={another ? 'Add an estate' : 'Set up your estate'}
          subtitle="Tell us about the community you manage"
          onBack={() => router.back()}
        />

        <View
          style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md }}
          accessible
          accessibilityLabel="Once it’s set up, you can add households, charge dues and add the gatemen who run your gates."
        >
          <View
            style={{
              width: 48,
              height: 48,
              borderRadius: radius.lg,
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: colors.accent,
            }}
          >
            <Building2 size={24} color={colors.primary} />
          </View>
          <Text variant="callout" color="mutedForeground" style={{ flex: 1 }}>
            Once it’s set up, you can add households, charge dues and add the gatemen who run your
            gates.
          </Text>
        </View>

        {onFree ? (
          <FormAlert
            tone="info"
            title="Running more than one estate"
            message="The Free plan includes one estate. Adding another is part of Pro."
          />
        ) : null}

        <Card elevated style={{ gap: spacing.md }}>
          <TextField
            label="Estate name"
            value={draft.name}
            onChangeText={set('name')}
            placeholder="e.g. Sunrise Gardens Estate"
            autoCapitalize="words"
            maxLength={120}
            error={errors.name}
          />
          <TextField
            label="Address"
            value={draft.address}
            onChangeText={set('address')}
            placeholder="e.g. 1 Garden Close"
            autoCapitalize="words"
            maxLength={200}
            error={errors.address}
          />
          <SelectField
            label="State"
            value={draft.state}
            options={STATE_OPTIONS}
            onChange={set('state')}
            placeholder="Select state"
            error={errors.state}
          />
          <View style={{ gap: spacing.sm }}>
            <TextField
              label="City or town"
              value={draft.city}
              onChangeText={set('city')}
              placeholder={cities[0] ? `e.g. ${cities[0]}` : 'e.g. Lekki'}
              autoCapitalize="words"
              maxLength={80}
              error={errors.city}
            />
            {cities.length ? (
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs }}>
                {cities.slice(0, 8).map((c) => (
                  <Chip
                    key={c}
                    label={c}
                    size="sm"
                    selected={draft.city.trim() === c}
                    onPress={() => set('city')(c)}
                  />
                ))}
              </View>
            ) : null}
          </View>
          <TextField
            label="Number of gates (optional)"
            value={draft.gateCount}
            onChangeText={(v) => set('gateCount')(v.replace(/[^0-9]/g, ''))}
            keyboardType="number-pad"
            maxLength={2}
            hint={`How many entrances the estate has, from 1 to ${MAX_GATES}.`}
            error={errors.gateCount}
          />
        </Card>

        {create.error ? (
          planBlocked ? (
            <FormAlert
              tone="warning"
              title="Your plan’s estate limit is reached"
              message={errorText(create.error, 'Upgrade to Pro to manage more than one estate.')}
            />
          ) : (
            <FormAlert
              message={errorText(create.error, 'We couldn’t create your estate. Please try again.')}
            />
          )
        ) : null}
        <Button
          label={another ? 'Add estate' : 'Create estate'}
          disabled={!filled}
          loading={create.isPending}
          onPress={submit}
        />
        {planBlocked ? (
          <Button
            label="See plans"
            variant="secondary"
            onPress={() => router.push('/(app)/billing')}
          />
        ) : null}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
