import { useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Switch,
  View,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Check, Search } from 'lucide-react-native';
import {
  Button,
  Card,
  Chip,
  DateField,
  FormAlert,
  SegmentedControl,
  Skeleton,
  Text,
  TextField,
  toISODate,
  useTheme,
  useToast,
} from '@getrentos/ui-native';
import { DetailHeader } from '@/components/dashboard/DetailHeader';
import { errorText } from '@/components/estate/EstateUI';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import { useEstate } from '@/hooks/useEstate';
import {
  BILLING_CYCLES,
  DUE_CATEGORIES,
  chargeAudience,
  estateManagerApi,
  type NewCharge,
} from '@/lib/api/estateManager';
import { haptics } from '@/lib/haptics';
import { qk } from '@/lib/query/keys';

const naira = (n: number) => `₦${Math.round(n).toLocaleString('en-NG')}`;

/**
 * Raise a charge: a service fee or levy for every active home, or for the ones
 * picked. Opened from a household, it starts with that home selected.
 */
export default function EstateCharge() {
  const params = useLocalSearchParams<{ householdId?: string }>();
  const { colors, spacing, radius } = useTheme();
  const insets = useSafeAreaInsets();
  const qc = useQueryClient();
  const toast = useToast();
  const { estate, estateId } = useEstate();

  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState<NewCharge['category']>('SERVICE_CHARGE');
  const [dueDate, setDueDate] = useState('');
  const [description, setDescription] = useState('');
  const [recurring, setRecurring] = useState(false);
  const [cycle, setCycle] = useState<NewCharge['billingCycle']>('MONTHLY');
  const [audience, setAudience] = useState<'all' | 'some'>(params.householdId ? 'some' : 'all');
  // id → unit label, so chosen homes stay visible whatever the search shows.
  const [picked, setPicked] = useState<Record<string, string>>({});
  const [search, setSearch] = useState('');
  const term = useDebouncedValue(search.trim(), 300);

  const active = useQuery({
    queryKey: qk.estateManager.households(estateId, term, 'ACTIVE'),
    queryFn: () =>
      estateManagerApi.households(estateId, { status: 'ACTIVE', search: term || undefined }),
    enabled: !!estateId,
  });
  const activeTotal = useQuery({
    queryKey: qk.estateManager.households(estateId, '', 'ACTIVE'),
    queryFn: () => estateManagerApi.households(estateId, { status: 'ACTIVE' }),
    enabled: !!estateId,
  });
  // Opened for one household: select it once it is known.
  const preset = useQuery({
    queryKey: qk.estateManager.household(estateId, params.householdId ?? ''),
    queryFn: () => estateManagerApi.household(estateId, params.householdId!),
    enabled: !!estateId && !!params.householdId,
  });
  const chosen: Record<string, string> =
    preset.data && !(preset.data.id in picked) && !Object.keys(picked).length
      ? { [preset.data.id]: preset.data.unitLabel }
      : picked;

  const n = Number(amount.replace(/\D/g, '')) || 0;
  const ids = Object.keys(chosen);
  const count = audience === 'all' ? (activeTotal.data?.total ?? 0) : ids.length;
  const ready = n >= 1 && !!dueDate && count > 0;

  const toggle = (id: string, label: string) =>
    setPicked(() => {
      const next = { ...chosen };
      if (id in next) delete next[id];
      else next[id] = label;
      return next;
    });

  const create = useMutation({
    mutationFn: () =>
      estateManagerApi.charge(estateId, {
        amount: n,
        // Due at the end of the chosen day, wherever the manager is.
        dueDate: new Date(`${dueDate}T23:59:00`).toISOString(),
        category,
        billingCycle: cycle,
        isRecurring: recurring,
        ...(description.trim() ? { description: description.trim() } : {}),
        ...(audience === 'some' ? { householdIds: ids } : {}),
      }),
    onSuccess: (res) => {
      void haptics.success();
      qc.invalidateQueries({ queryKey: qk.estateManager.estate(estateId) });
      toast.show(
        `Charged ${res.created} ${res.created === 1 ? 'household' : 'households'}. Residents with the app have been told.`,
        'success'
      );
      router.back();
    },
  });

  const every = BILLING_CYCLES.find((c) => c.value === cycle)!.every;
  const confirm = () =>
    Alert.alert(
      `Charge ${naira(n)} to ${count} ${count === 1 ? 'household' : 'households'}?`,
      `${naira(n * count)} in total${recurring ? `, repeating ${every}` : ''}. A charge can’t be edited once raised.`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Charge', onPress: () => create.mutate() },
      ]
    );

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
          eyebrow={estate?.name ?? 'Dues'}
          title="Charge dues"
          onBack={() => router.back()}
        />

        <Card elevated style={{ gap: spacing.md }}>
          <TextField
            label="Amount per household (₦)"
            keyboardType="number-pad"
            value={n ? n.toLocaleString('en-NG') : ''}
            onChangeText={setAmount}
            autoFocus
          />
          <View style={{ gap: spacing.sm }}>
            <Text variant="bodyStrong">What it’s for</Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>
              {DUE_CATEGORIES.map((c) => (
                <Chip
                  key={c.value}
                  label={c.label}
                  size="sm"
                  selected={category === c.value}
                  onPress={() => setCategory(c.value)}
                />
              ))}
            </View>
          </View>
          <TextField
            label="Note (optional)"
            value={description}
            onChangeText={setDescription}
            placeholder="e.g. Q4 security and waste"
            hint="Residents see this on the charge"
          />
          <DateField
            label="Due by"
            value={dueDate}
            onChange={setDueDate}
            min={toISODate(new Date())}
          />
          {estate && dueDate ? (
            <Text variant="caption" color="mutedForeground">
              {estate.lateFeeAmount
                ? `Unpaid ${estate.graceDays ? `${estate.graceDays} day${estate.graceDays === 1 ? '' : 's'} after` : 'after'} that, ${naira(estate.lateFeeAmount)} is added as a late fee.`
                : 'No late fee is set for this estate.'}
            </Text>
          ) : null}
        </Card>

        <Card elevated style={{ gap: spacing.md }}>
          <View
            style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md, minHeight: 44 }}
          >
            <View style={{ flex: 1 }}>
              <Text variant="bodyStrong">Repeat this charge</Text>
              <Text variant="caption" color="mutedForeground">
                The next one is raised automatically
              </Text>
            </View>
            <Switch
              value={recurring}
              onValueChange={setRecurring}
              accessibilityLabel="Repeat this charge"
              trackColor={{ true: colors.primary, false: colors.border }}
            />
          </View>
          {recurring ? (
            <SegmentedControl
              accessibilityLabel="How often"
              value={cycle}
              onChange={setCycle}
              options={BILLING_CYCLES.map((c) => ({ value: c.value, label: c.label }))}
            />
          ) : null}
        </Card>

        <Card elevated style={{ gap: spacing.md }}>
          <Text variant="bodyStrong" accessibilityRole="header">
            Who pays
          </Text>
          <SegmentedControl
            accessibilityLabel="Who pays"
            value={audience}
            onChange={setAudience}
            options={[
              { value: 'all', label: 'Every home' },
              { value: 'some', label: 'Choose homes' },
            ]}
          />
          {audience === 'all' ? (
            <Text variant="callout" color="mutedForeground">
              {activeTotal.isPending
                ? 'Counting active households…'
                : chargeAudience(0, activeTotal.data?.total ?? 0)}
              . Inactive homes are skipped.
            </Text>
          ) : (
            <>
              {ids.length ? (
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>
                  {ids.map((id) => (
                    <Chip
                      key={id}
                      label={`${chosen[id]} ✕`}
                      size="sm"
                      selected
                      onPress={() => toggle(id, chosen[id])}
                    />
                  ))}
                </View>
              ) : null}
              <TextField
                placeholder="Search unit or name"
                accessibilityLabel="Search households to charge"
                leftIcon={<Search size={16} color={colors.mutedForeground} />}
                autoCapitalize="none"
                value={search}
                onChangeText={setSearch}
              />
              {active.isPending ? (
                <Skeleton height={120} radius={radius.md} />
              ) : !active.data?.items.length ? (
                <Text variant="callout" color="mutedForeground">
                  {term ? 'No active household matches.' : 'No active households yet.'}
                </Text>
              ) : (
                <View>
                  {active.data.items.slice(0, 12).map((h) => {
                    const on = h.id in chosen;
                    return (
                      <Pressable
                        key={h.id}
                        onPress={() => toggle(h.id, h.unitLabel)}
                        accessibilityRole="checkbox"
                        accessibilityState={{ checked: on }}
                        accessibilityLabel={`${h.unitLabel}, ${h.residentName}`}
                        style={{
                          flexDirection: 'row',
                          alignItems: 'center',
                          gap: spacing.md,
                          minHeight: 48,
                        }}
                      >
                        <View
                          style={{
                            width: 22,
                            height: 22,
                            borderRadius: 6,
                            borderWidth: 1.5,
                            borderColor: on ? colors.primary : colors.border,
                            backgroundColor: on ? colors.primary : 'transparent',
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                        >
                          {on ? <Check size={14} color={colors.primaryForeground} /> : null}
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text variant="callout" style={{ fontWeight: '600' }} numberOfLines={1}>
                            {h.unitLabel}
                          </Text>
                          <Text variant="caption" color="mutedForeground" numberOfLines={1}>
                            {h.residentName}
                          </Text>
                        </View>
                      </Pressable>
                    );
                  })}
                  {active.data.total > 12 ? (
                    <Text
                      variant="caption"
                      color="mutedForeground"
                      style={{ marginTop: spacing.xs }}
                    >
                      Showing 12 of {active.data.total.toLocaleString('en-NG')}. Search to find a
                      home.
                    </Text>
                  ) : null}
                </View>
              )}
            </>
          )}
        </Card>

        {create.error ? (
          <FormAlert message={errorText(create.error, 'Could not raise this charge.')} />
        ) : null}
        <Button
          label={
            ready
              ? `Charge ${naira(n)} × ${count} = ${naira(n * count)}`
              : audience === 'some' && !ids.length
                ? 'Choose at least one home'
                : 'Charge'
          }
          disabled={!ready}
          loading={create.isPending}
          onPress={confirm}
        />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
