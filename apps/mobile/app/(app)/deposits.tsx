import { useState } from 'react';
import { RefreshControl, View } from 'react-native';
import { router } from 'expo-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { FlashList } from '@shopify/flash-list';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { PiggyBank, Plus } from 'lucide-react-native';
import {
  Badge,
  Button,
  Card,
  IconButton,
  ListSkeleton,
  NumberField,
  PressableScale,
  Price,
  QueryState,
  SegmentedControl,
  Text,
  useTheme,
  useToast,
} from '@sureground/ui-native';
import { qk } from '@/lib/query/keys';
import {
  DEPOSIT_STATUS_LABEL,
  DEPOSIT_STATUS_TONE,
  managementApi,
  type DepositListItem,
  type DepositStatus,
} from '@/lib/api/management';
import { landlordApi } from '@/lib/api/landlord';
import { errorMessage } from '@/lib/api/client';
import { formatDate } from '@/lib/format';
import { Sheet } from '@/components/Sheet';
import { ChipSelect } from '@/components/landlord/ChipSelect';
import { DetailScreenHeader } from '@/components/dashboard/DetailScreenHeader';
import { goBack } from '@/lib/goBack';

type Filter = 'all' | DepositStatus;
const FILTERS: { value: Filter; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'HELD', label: 'Held' },
  { value: 'PARTIALLY_RETURNED', label: 'Partly' },
  { value: 'RETURNED', label: 'Returned' },
];

const HOLDABLE = new Set(['signed', 'active', 'awaiting_landlord']);

export default function Deposits() {
  const { colors, spacing } = useTheme();
  const insets = useSafeAreaInsets();
  const [filter, setFilter] = useState<Filter>('all');
  const [recording, setRecording] = useState(false);

  const list = useQuery({
    queryKey: qk.management.deposits(filter),
    queryFn: () => managementApi.deposits(filter === 'all' ? undefined : filter, 1, 50),
  });

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <DetailScreenHeader
        eyebrow="Tenancies"
        title="Deposits"
        subtitle="Held, deducted and returned"
        onBack={() => goBack()}
        accessory={
          <IconButton
            onPress={() => setRecording(true)}
            accessibilityLabel="Record a deposit"
            icon={<Plus size={20} color={colors.primary} />}
          />
        }
      />

      <View style={{ paddingHorizontal: spacing.xl, marginBottom: spacing.lg }}>
        <SegmentedControl
          options={FILTERS}
          value={filter}
          onChange={setFilter}
          accessibilityLabel="Filter by status"
        />
      </View>
      <QueryState
        query={list}
        skeleton={<ListSkeleton rows={3} variant="card" height={96} />}
        isEmpty={(list.data?.items ?? []).length === 0}
        empty={{
          icon: <PiggyBank size={32} color={colors.mutedForeground} />,
          title: 'No deposits',
          description: "Record a tenant's security deposit against their signed lease.",
        }}
        style={{ paddingHorizontal: spacing.xl }}
      >
        <FlashList
          data={list.data?.items ?? []}
          keyExtractor={(d) => d.id}
          renderItem={({ item }: { item: DepositListItem }) => <DepositRow deposit={item} />}
          contentContainerStyle={{
            paddingHorizontal: spacing.xl,
            paddingBottom: insets.bottom + spacing['3xl'],
          }}
          refreshControl={
            <RefreshControl
              refreshing={list.isRefetching}
              onRefresh={() => void list.refetch()}
              tintColor={colors.mutedForeground}
            />
          }
        />
      </QueryState>

      <Sheet open={recording} onClose={() => setRecording(false)} title="Record a deposit">
        <RecordDepositForm
          key={recording ? 'open' : 'closed'}
          onDone={(id) => {
            setRecording(false);
            router.push(`/(app)/deposit/${id}`);
          }}
        />
      </Sheet>
    </View>
  );
}

function DepositRow({ deposit: d }: { deposit: DepositListItem }) {
  const { spacing } = useTheme();
  return (
    <PressableScale
      onPress={() => router.push(`/(app)/deposit/${d.id}`)}
      accessibilityRole="button"
      accessibilityLabel={`${d.propertyTitle ?? 'Property'} deposit, ${DEPOSIT_STATUS_LABEL[d.status]}`}
      style={{ marginBottom: spacing.sm }}
    >
      <Card padding={spacing.lg} style={{ gap: spacing.sm }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
          <Text variant="bodyStrong" style={{ flex: 1 }} numberOfLines={1}>
            {d.propertyTitle ?? 'Property'}
          </Text>
          <Badge label={DEPOSIT_STATUS_LABEL[d.status]} tone={DEPOSIT_STATUS_TONE[d.status]} />
        </View>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
          <View>
            <Text variant="caption" color="mutedForeground">
              Held
            </Text>
            <Price amount={d.amount} variant="bodyStrong" />
          </View>
          <View style={{ alignItems: 'flex-end' }}>
            <Text variant="caption" color="mutedForeground">
              Returnable
            </Text>
            <Price amount={d.returnable} variant="bodyStrong" />
          </View>
        </View>
        <Text variant="caption" color="mutedForeground">
          Recorded {formatDate(d.createdAt, 'short')}
          {d.heldBySureground ? ' · Held by Sureground' : ''}
        </Text>
      </Card>
    </PressableScale>
  );
}

function RecordDepositForm({ onDone }: { onDone: (id: string) => void }) {
  const { spacing } = useTheme();
  const qc = useQueryClient();
  const toast = useToast();
  const leases = useQuery({
    queryKey: qk.landlord.leases(1, 100),
    queryFn: () => landlordApi.leases(1, 100),
  });
  const holdable = (leases.data?.items ?? []).filter((l) => HOLDABLE.has(l.status));

  const [leaseId, setLeaseId] = useState<string | undefined>();
  const [amount, setAmount] = useState('');

  const pick = (id: string) => {
    setLeaseId(id);
    const lease = holdable.find((l) => l.id === id);
    if (lease?.securityDeposit) setAmount(String(lease.securityDeposit));
  };

  const create = useMutation({
    mutationFn: () => managementApi.createDeposit({ leaseId: leaseId!, amount: Number(amount) }),
    onSuccess: (d) => {
      qc.invalidateQueries({ queryKey: ['management', 'deposits'] });
      toast.show('Deposit recorded.', 'success');
      onDone(d.id);
    },
    onError: (e) => toast.show(errorMessage(e, 'Could not record the deposit.'), 'error'),
  });

  if (leases.isLoading) return <ListSkeleton rows={3} />;

  return (
    <View style={{ gap: spacing.lg }}>
      <Text variant="callout" color="mutedForeground">
        Hold a tenant&apos;s security deposit against their tenancy.
      </Text>
      <ChipSelect
        label="Tenancy"
        options={holdable.map((l) => ({
          value: l.id,
          label: `${l.tenantName} · ${l.propertyName}${l.unitName ? ` (${l.unitName})` : ''}`,
        }))}
        value={leaseId}
        onChange={pick}
        emptyText="No signed leases yet. A deposit is held against a signed tenancy."
      />
      <NumberField
        currency
        label="Amount"
        value={amount}
        onValueChange={setAmount}
        editable={!create.isPending}
        required
      />
      <Button
        label="Record deposit"
        loading={create.isPending}
        disabled={!leaseId || !(Number(amount) > 0) || create.isPending}
        onPress={() => create.mutate()}
      />
    </View>
  );
}
