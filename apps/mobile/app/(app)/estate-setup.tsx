import { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, View } from 'react-native';
import { router } from 'expo-router';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Building2 } from '@sureground/icons/native';
import {
  Button,
  Card,
  FormAlert,
  NumberField,
  Text,
  TextField,
  useTheme,
  useToast,
} from '@sureground/ui-native';
import { DetailHeader } from '@/components/dashboard/DetailHeader';
import { AddressFields, type AddressFieldsValue } from '@/components/forms/AddressFields';
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
import { haptics } from '@/lib/haptics';
import { qk } from '@/lib/query/keys';
import { goBack } from '@/lib/goBack';
import { errorMessage } from '@/lib/api/client';

export default function EstateSetup() {
  const { colors, spacing, radius } = useTheme();
  const insets = useSafeAreaInsets();
  const qc = useQueryClient();
  const toast = useToast();
  const { estates, select } = useEstate();
  const [draft, setDraft] = useState<Pick<EstateDraft, 'name' | 'gateCount'>>({
    name: '',
    gateCount: '1',
  });
  const [location, setLocation] = useState<AddressFieldsValue>({
    address: '',
    city: '',
    state: '',
    country: 'Nigeria',
  });
  const [errors, setErrors] = useState<EstateDraftErrors>({});
  const another = estates.length > 0;
  const onFree = another && estates.some((e) => isFreeEstate(e));

  const set = (field: keyof typeof draft) => (value: string) => {
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
    const checked = validateEstateDraft({
      ...draft,
      address: location.address,
      city: location.city,
      state: location.state,
      placeId: location.placeId,
    });
    if (!checked.ok) {
      setErrors(checked.errors);
      void haptics.error();
      return;
    }
    setErrors({});
    create.mutate(checked.body);
  };

  const filled =
    !!draft.name.trim() &&
    !!location.address.trim() &&
    (!!location.placeId || (!!location.city.trim() && !!location.state));
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
          onBack={() => goBack()}
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
            required
            value={draft.name}
            onChangeText={set('name')}
            placeholder="e.g. Sunrise Gardens Estate"
            autoCapitalize="words"
            maxLength={120}
            error={errors.name}
          />
          <AddressFields
            required
            value={location}
            onChange={(patch) => {
              setLocation((l) => ({ ...l, ...patch }));
              setErrors((e) => ({ ...e, address: undefined, city: undefined, state: undefined }));
            }}
            error={errors.address}
            errors={{ state: errors.state, city: errors.city }}
          />
          <NumberField
            label="Number of gates (optional)"
            value={draft.gateCount}
            onValueChange={set('gateCount')}
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
              message={errorMessage(create.error, 'Upgrade to Pro to manage more than one estate.')}
            />
          ) : (
            <FormAlert
              message={errorMessage(
                create.error,
                'We couldn’t create your estate. Please try again.'
              )}
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
