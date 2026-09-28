import { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, Switch, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
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
import { qk } from '@/lib/query/keys';
import {
  CATEGORIES,
  PRIORITIES,
  homeCareApi,
  type Category,
  type Priority,
} from '@/lib/api/homeCare';
import { ApiError } from '@/lib/api/client';
import { haptics } from '@/lib/haptics';
import { useMyHomes } from '@/hooks/useMyHomes';
import { DetailHeader } from '@/components/dashboard/DetailHeader';
import { VendorPicker } from '@/components/homecare/VendorPicker';

export default function NewWorkOrder() {
  const { colors, spacing, radius } = useTheme();
  const insets = useSafeAreaInsets();
  const qc = useQueryClient();
  const toast = useToast();
  const homes = useMyHomes();
  // "Log a repair" from an asset opens this with the home and item chosen.
  const params = useLocalSearchParams<{ propertyId?: string; assetId?: string; title?: string }>();
  const [propertyId, setPropertyId] = useState(params.propertyId ?? '');
  const [unitId, setUnitId] = useState('');
  const [newUnit, setNewUnit] = useState('');
  const [assetId, setAssetId] = useState<string | undefined>(params.assetId);
  const [title, setTitle] = useState(params.title ?? '');
  const [category, setCategory] = useState<Category>('PLUMBING');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<Priority>('MEDIUM');
  const [emergency, setEmergency] = useState(false);
  const [dueAt, setDueAt] = useState('');
  const [cost, setCost] = useState('');
  const [approval, setApproval] = useState(false);
  const [vendorId, setVendorId] = useState<string | undefined>();

  const units = useQuery({
    queryKey: qk.homeCare.units(propertyId),
    queryFn: () => homeCareApi.units(propertyId),
    enabled: !!propertyId,
  });
  const assets = useQuery({
    queryKey: qk.homeCare.assets(propertyId),
    queryFn: () => homeCareApi.assets(propertyId),
    enabled: !!propertyId,
  });

  const create = useMutation({
    mutationFn: async () => {
      // A home with no units yet gets one named by the host, in the same step.
      const unit = unitId || (await homeCareApi.addUnit(propertyId, newUnit.trim())).id;
      const estimated = Number(cost.replace(/\D/g, '')) || undefined;
      return homeCareApi.createWorkOrder({
        propertyId,
        unitId: unit,
        assetId,
        issueTitle: title.trim(),
        category,
        description: description.trim(),
        priority: emergency ? 'URGENT' : priority,
        isEmergency: emergency,
        dueAt: dueAt ? new Date(`${dueAt}T17:00:00`).toISOString() : undefined,
        estimatedCost: estimated,
        approvalRequired: approval,
        assignedVendorId: vendorId,
      });
    },
    onSuccess: (w) => {
      void haptics.success();
      qc.invalidateQueries({ queryKey: ['home-care'] });
      toast.show(
        emergency ? 'Emergency logged. The response clock is running.' : 'Work order created.',
        'success'
      );
      router.replace({ pathname: '/(app)/home-care/work-order/[id]', params: { id: w.id } });
    },
    onError: () => void haptics.error(),
  });

  const unitReady = !!unitId || newUnit.trim().length > 0;
  const ready = !!propertyId && unitReady && title.trim() && description.trim();

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
          paddingBottom: spacing['3xl'],
          gap: spacing.xl,
        }}
      >
        <DetailHeader eyebrow="Home care" title="New work order" onBack={() => router.back()} />

        <Section title="Where">
          {homes.isPending ? (
            <Skeleton height={44} radius={radius.md} />
          ) : (
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>
              {(homes.data ?? []).map((h) => (
                <Chip
                  key={h.id}
                  label={h.name}
                  selected={propertyId === h.id}
                  onPress={() => {
                    setPropertyId(h.id);
                    setUnitId('');
                    setAssetId(undefined);
                  }}
                />
              ))}
            </View>
          )}
          {propertyId ? (
            units.isPending ? (
              <Skeleton height={36} radius={radius.md} />
            ) : units.data?.length ? (
              <View style={{ gap: spacing.xs }}>
                <Text variant="callout" color="mutedForeground">
                  Unit
                </Text>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>
                  {units.data.map((u) => (
                    <Chip
                      key={u.id}
                      label={u.unitName}
                      size="sm"
                      selected={unitId === u.id}
                      onPress={() => setUnitId(u.id)}
                    />
                  ))}
                </View>
              </View>
            ) : (
              <TextField
                label="Name this home’s unit"
                value={newUnit}
                onChangeText={setNewUnit}
                hint="e.g. “Main house” or “Flat 2”. Needed once per home."
              />
            )
          ) : null}
          {propertyId && assets.data?.items.length ? (
            <View style={{ gap: spacing.xs }}>
              <Text variant="callout" color="mutedForeground">
                Which item (optional)
              </Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>
                {assets.data.items.map((a) => (
                  <Chip
                    key={a.id}
                    label={a.name}
                    size="sm"
                    selected={assetId === a.id}
                    onPress={() => setAssetId(assetId === a.id ? undefined : a.id)}
                  />
                ))}
              </View>
            </View>
          ) : null}
        </Section>

        <Section title="What’s wrong">
          <TextField label="In a few words" value={title} onChangeText={setTitle} maxLength={120} />
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>
            {CATEGORIES.map((c) => (
              <Chip
                key={c.value}
                label={c.label}
                size="sm"
                selected={category === c.value}
                onPress={() => setCategory(c.value)}
              />
            ))}
          </View>
          <TextField
            label="Details"
            value={description}
            onChangeText={setDescription}
            multiline
            hint="What happened, where exactly, and anything the vendor should know."
          />
        </Section>

        <Section title="How urgent">
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md }}>
            <View style={{ flex: 1 }}>
              <Text variant="body">Emergency</Text>
              <Text variant="caption" color="mutedForeground">
                Burst pipe, no power, broken lock. Sets urgent priority and escalates if nobody
                responds.
              </Text>
            </View>
            <Switch
              value={emergency}
              onValueChange={setEmergency}
              accessibilityLabel="Emergency"
              trackColor={{ true: colors.destructive, false: colors.border }}
            />
          </View>
          {!emergency ? (
            <SegmentedControl
              accessibilityLabel="Priority"
              value={priority}
              onChange={setPriority}
              options={PRIORITIES}
            />
          ) : null}
          <DateField
            label="Needed by (optional)"
            value={dueAt}
            onChange={setDueAt}
            min={toISODate(new Date())}
          />
        </Section>

        <Section title="Budget & vendor">
          <TextField
            label="Estimated cost (₦, optional)"
            keyboardType="number-pad"
            value={
              Number(cost.replace(/\D/g, ''))
                ? Number(cost.replace(/\D/g, '')).toLocaleString('en-NG')
                : ''
            }
            onChangeText={setCost}
          />
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md }}>
            <View style={{ flex: 1 }}>
              <Text variant="body">Needs spend approval</Text>
              <Text variant="caption" color="mutedForeground">
                Work can’t start until you approve a budget or a vendor’s quote. Good for bigger
                jobs.
              </Text>
            </View>
            <Switch
              value={approval}
              onValueChange={setApproval}
              accessibilityLabel="Needs spend approval"
              trackColor={{ true: colors.primary, false: colors.border }}
            />
          </View>
          <VendorPicker value={vendorId} onChange={setVendorId} optional />
        </Section>

        {create.error ? (
          <FormAlert
            message={
              create.error instanceof ApiError
                ? create.error.message
                : 'Could not create the work order.'
            }
          />
        ) : null}
      </ScrollView>
      <View
        style={{
          paddingHorizontal: spacing.xl,
          paddingTop: spacing.md,
          paddingBottom: insets.bottom + spacing.md,
          borderTopWidth: 1,
          borderTopColor: colors.border,
          backgroundColor: colors.card,
        }}
      >
        <Button
          label={emergency ? 'Log emergency' : 'Create work order'}
          variant={emergency ? 'destructive' : 'primary'}
          disabled={!ready}
          loading={create.isPending}
          onPress={() => create.mutate()}
        />
      </View>
    </KeyboardAvoidingView>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  const { spacing } = useTheme();
  return (
    <View style={{ gap: spacing.sm }}>
      <Text variant="heading" accessibilityRole="header">
        {title}
      </Text>
      <Card elevated style={{ gap: spacing.md }}>
        {children}
      </Card>
    </View>
  );
}
