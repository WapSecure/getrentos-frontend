import { useMemo, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  View,
} from 'react-native';
import { router } from 'expo-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Boxes, ChevronRight, Plus, ShieldAlert } from 'lucide-react-native';
import {
  Button,
  Card,
  Chip,
  DateField,
  EmptyState,
  ErrorState,
  FormAlert,
  IconButton,
  SegmentedControl,
  Skeleton,
  Text,
  TextField,
  useTheme,
  useToast,
} from '@getrentos/ui-native';
import { qk } from '@/lib/query/keys';
import { homeCareApi, type Asset, type AssetStatus } from '@/lib/api/homeCare';
import { ApiError } from '@/lib/api/client';
import { formatDate } from '@/lib/format';
import { haptics } from '@/lib/haptics';
import { useMyHomes } from '@/hooks/useMyHomes';
import { DetailHeader } from '@/components/dashboard/DetailHeader';
import { Sheet } from '@/components/Sheet';
import { StatusPill, type Tone } from '@/components/host/HostUI';

const STATUS: Record<AssetStatus, { label: string; tone: Tone }> = {
  ACTIVE: { label: 'Working', tone: 'success' },
  NEEDS_SERVICE: { label: 'Needs service', tone: 'warning' },
  RETIRED: { label: 'Retired', tone: 'neutral' },
};
const ASSET_KINDS = [
  'Air conditioner',
  'Generator',
  'Inverter',
  'Water pump',
  'Borehole',
  'Fridge',
  'Water heater',
  'Gate motor',
  'CCTV',
  'Other',
];

/** What warranty news to show: expired, expiring within 60 days, or nothing. */
function warranty(a: Asset): { text: string; warn: boolean } | null {
  if (!a.warrantyExpiresAt) return null;
  const days = Math.round((new Date(a.warrantyExpiresAt).getTime() - Date.now()) / 86_400_000);
  if (days < 0) return { text: 'Warranty expired', warn: true };
  if (days <= 60)
    return { text: `Warranty ends in ${days} day${days === 1 ? '' : 's'}`, warn: true };
  return { text: `Warranty to ${formatDate(a.warrantyExpiresAt, 'medium')}`, warn: false };
}

/** The things in each home that break: ACs, generators, pumps: with warranties and servicing. */
export default function Assets() {
  const { colors, spacing, radius } = useTheme();
  const insets = useSafeAreaInsets();
  const homes = useMyHomes();
  const [propertyId, setPropertyId] = useState('');
  const [status, setStatus] = useState<'all' | AssetStatus>('all');
  const [selected, setSelected] = useState<Asset | null>(null);
  const [adding, setAdding] = useState(false);
  const query = useQuery({
    queryKey: qk.homeCare.assets(propertyId || 'all'),
    queryFn: () => homeCareApi.assets(propertyId || undefined),
  });
  const items = useMemo(
    () => (query.data?.items ?? []).filter((a) => status === 'all' || a.status === status),
    [query.data, status]
  );

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <ScrollView
        refreshControl={
          <RefreshControl
            refreshing={query.isRefetching}
            onRefresh={() => query.refetch()}
            tintColor={colors.mutedForeground}
          />
        }
        contentContainerStyle={{
          paddingTop: insets.top + spacing.md,
          paddingHorizontal: spacing.xl,
          paddingBottom: insets.bottom + spacing['3xl'],
          gap: spacing.lg,
        }}
      >
        <DetailHeader
          eyebrow="Home care"
          title="Assets"
          subtitle="Appliances and equipment in each home"
          onBack={() => router.back()}
          accessory={
            <IconButton
              accessibilityLabel="Add an asset"
              icon={<Plus size={20} color={colors.primary} />}
              onPress={() => setAdding(true)}
            />
          }
        />
        {(homes.data?.length ?? 0) > 1 ? (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ gap: spacing.sm }}
          >
            <Chip label="All homes" selected={!propertyId} onPress={() => setPropertyId('')} />
            {homes.data!.map((h) => (
              <Chip
                key={h.id}
                label={h.name}
                selected={propertyId === h.id}
                onPress={() => setPropertyId(h.id)}
              />
            ))}
          </ScrollView>
        ) : null}
        <SegmentedControl
          accessibilityLabel="Condition"
          value={status}
          onChange={setStatus}
          options={[
            { value: 'all', label: 'All' },
            { value: 'NEEDS_SERVICE', label: 'Needs service' },
            { value: 'ACTIVE', label: 'Working' },
            { value: 'RETIRED', label: 'Retired' },
          ]}
        />
        {query.isError && !query.data ? (
          <ErrorState onRetry={() => query.refetch()} />
        ) : query.isPending ? (
          <Skeleton height={100} radius={radius.lg} />
        ) : !items.length ? (
          <EmptyState
            icon={<Boxes size={34} color={colors.mutedForeground} />}
            title={query.data?.items.length ? 'Nothing here' : 'No assets yet'}
            description="Record the AC, generator and pumps in each home to track warranties and service them on time."
            action={<Button label="Add an asset" onPress={() => setAdding(true)} />}
          />
        ) : (
          items.map((a) => {
            const s = STATUS[a.status];
            const wty = warranty(a);
            const next = a.preventivePlans?.[0]?.nextDueAt;
            return (
              <Pressable
                key={a.id}
                onPress={() => setSelected(a)}
                accessibilityRole="button"
                accessibilityLabel={`${a.name}, ${s.label}`}
              >
                {({ pressed }) => (
                  <Card elevated style={{ gap: spacing.sm, opacity: pressed ? 0.92 : 1 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
                      <View style={{ flex: 1 }}>
                        <Text variant="bodyStrong">{a.name}</Text>
                        <Text variant="caption" color="mutedForeground" numberOfLines={1}>
                          {a.category} · {a.property?.title ?? a.property?.name ?? ''}
                          {a.unit?.unitName ? ` · ${a.unit.unitName}` : ''}
                        </Text>
                      </View>
                      <ChevronRight size={18} color={colors.mutedForeground} />
                    </View>
                    <View
                      style={{
                        flexDirection: 'row',
                        flexWrap: 'wrap',
                        alignItems: 'center',
                        gap: spacing.sm,
                      }}
                    >
                      <StatusPill label={s.label} tone={s.tone} />
                      {wty ? (
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                          {wty.warn ? <ShieldAlert size={13} color={colors.warning} /> : null}
                          <Text
                            variant="caption"
                            style={{ color: wty.warn ? colors.warning : colors.mutedForeground }}
                          >
                            {wty.text}
                          </Text>
                        </View>
                      ) : null}
                    </View>
                    {next ? (
                      <Text variant="caption" color="mutedForeground">
                        Next service {formatDate(next, 'medium')}
                      </Text>
                    ) : null}
                  </Card>
                )}
              </Pressable>
            );
          })
        )}
      </ScrollView>

      <Sheet open={!!selected} onClose={() => setSelected(null)} title={selected?.name}>
        {selected ? <AssetActions a={selected} onDone={() => setSelected(null)} /> : null}
      </Sheet>
      <Sheet open={adding} onClose={() => setAdding(false)} title="Add an asset">
        {adding ? <AddAsset defaultHome={propertyId} onDone={() => setAdding(false)} /> : null}
      </Sheet>
    </View>
  );
}

function AssetActions({ a, onDone }: { a: Asset; onDone: () => void }) {
  const { spacing } = useTheme();
  const qc = useQueryClient();
  const toast = useToast();
  const set = useMutation({
    mutationFn: (status: AssetStatus) => homeCareApi.setAssetStatus(a.id, status),
    onSuccess: (_n, status) => {
      void haptics.success();
      qc.invalidateQueries({ queryKey: ['home-care'] });
      toast.show(`Marked ${STATUS[status].label.toLowerCase()}.`, 'success');
      onDone();
    },
    onError: (e) => toast.show(e instanceof ApiError ? e.message : 'Could not update it.', 'error'),
  });
  const facts = [
    ['Make', [a.manufacturer, a.modelNumber].filter(Boolean).join(' ')],
    ['Serial', a.serialNumber],
    ['Installed', a.installedAt ? formatDate(a.installedAt, 'medium') : null],
    ['Warranty', a.warrantyExpiresAt ? formatDate(a.warrantyExpiresAt, 'medium') : null],
  ].filter(([, v]) => v) as [string, string][];
  return (
    <View style={{ gap: spacing.md }}>
      {facts.map(([k, v]) => (
        <View key={k} style={{ flexDirection: 'row', gap: spacing.md }}>
          <Text variant="callout" color="mutedForeground" style={{ width: 90 }}>
            {k}
          </Text>
          <Text variant="callout" style={{ flex: 1, fontWeight: '600' }}>
            {v}
          </Text>
        </View>
      ))}
      <Button
        label="Log a repair for this"
        onPress={() => {
          onDone();
          router.push({
            pathname: '/(app)/home-care/new-work-order',
            params: { propertyId: a.propertyId, assetId: a.id, title: `${a.name} needs repair` },
          });
        }}
      />
      <Text variant="callout" color="mutedForeground">
        Condition
      </Text>
      <View style={{ flexDirection: 'row', gap: spacing.sm }}>
        {(Object.keys(STATUS) as AssetStatus[]).map((s) => (
          <Chip
            key={s}
            label={STATUS[s].label}
            selected={a.status === s}
            disabled={set.isPending}
            onPress={() => (s !== a.status ? set.mutate(s) : undefined)}
          />
        ))}
      </View>
    </View>
  );
}

function AddAsset({ defaultHome, onDone }: { defaultHome: string; onDone: () => void }) {
  const { spacing } = useTheme();
  const qc = useQueryClient();
  const toast = useToast();
  const homes = useMyHomes();
  const [propertyId, setPropertyId] = useState(defaultHome || homes.data?.[0]?.id || '');
  const [name, setName] = useState('');
  const [category, setCategory] = useState('Air conditioner');
  const [make, setMake] = useState('');
  const [serial, setSerial] = useState('');
  const [installed, setInstalled] = useState('');
  const [warrantyTo, setWarrantyTo] = useState('');
  const add = useMutation({
    mutationFn: () =>
      homeCareApi.addAsset({
        propertyId,
        name: name.trim() || category,
        category,
        manufacturer: make.trim() || undefined,
        serialNumber: serial.trim() || undefined,
        installedAt: installed ? new Date(`${installed}T12:00:00`).toISOString() : undefined,
        warrantyExpiresAt: warrantyTo
          ? new Date(`${warrantyTo}T12:00:00`).toISOString()
          : undefined,
      }),
    onSuccess: () => {
      void haptics.success();
      qc.invalidateQueries({ queryKey: ['home-care'] });
      toast.show('Asset added.', 'success');
      onDone();
    },
  });
  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={{ gap: spacing.md }}>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>
          {(homes.data ?? []).map((h) => (
            <Chip
              key={h.id}
              label={h.name}
              size="sm"
              selected={propertyId === h.id}
              onPress={() => setPropertyId(h.id)}
            />
          ))}
        </View>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>
          {ASSET_KINDS.map((k) => (
            <Chip
              key={k}
              label={k}
              size="sm"
              selected={category === k}
              onPress={() => setCategory(k)}
            />
          ))}
        </View>
        <TextField
          label="Name"
          value={name}
          onChangeText={setName}
          hint={`e.g. “Living room ${category.toLowerCase()}”`}
        />
        <TextField label="Make / model (optional)" value={make} onChangeText={setMake} />
        <TextField
          label="Serial number (optional)"
          value={serial}
          onChangeText={setSerial}
          autoCapitalize="characters"
        />
        <View style={{ flexDirection: 'row', gap: spacing.md }}>
          <View style={{ flex: 1 }}>
            <DateField label="Installed" value={installed} onChange={setInstalled} />
          </View>
          <View style={{ flex: 1 }}>
            <DateField label="Warranty to" value={warrantyTo} onChange={setWarrantyTo} />
          </View>
        </View>
        {add.error ? (
          <FormAlert
            message={add.error instanceof ApiError ? add.error.message : 'Could not add it.'}
          />
        ) : null}
        <Button
          label="Add asset"
          disabled={!propertyId}
          loading={add.isPending}
          onPress={() => add.mutate()}
        />
      </View>
    </KeyboardAvoidingView>
  );
}
