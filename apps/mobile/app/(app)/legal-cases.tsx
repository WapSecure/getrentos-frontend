import { useState } from 'react';
import { RefreshControl, View } from 'react-native';
import { router } from 'expo-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { FlashList } from '@shopify/flash-list';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Plus, Scale } from 'lucide-react-native';
import {
  Badge,
  Button,
  Card,
  EmptyState,
  FormAlert,
  IconButton,
  ListSkeleton,
  PressableScale,
  QueryState,
  SegmentedControl,
  Text,
  TextField,
  useTheme,
  useToast,
} from '@sureground/ui-native';
import { qk } from '@/lib/query/keys';
import {
  CASE_KINDS,
  isDone,
  LEGAL_STATUS,
  legalCasesApi,
  needsAttention,
  nextLine,
  openBlocker,
  type LegalCase,
  type LegalCaseKind,
} from '@/lib/api/legalCases';
import { landlordApi } from '@/lib/api/landlord';
import { errorMessage } from '@/lib/api/client';
import { formatDate } from '@/lib/format';
import { useMyHomes } from '@/hooks/useMyHomes';
import { Sheet } from '@/components/Sheet';
import { ChipSelect } from '@/components/landlord/ChipSelect';
import { DetailScreenHeader } from '@/components/dashboard/DetailScreenHeader';
import { goBack } from '@/lib/goBack';

type Filter = 'attention' | 'active' | 'done' | 'all';
const FILTERS: { value: Filter; label: string }[] = [
  { value: 'attention', label: 'Attention' },
  { value: 'active', label: 'Active' },
  { value: 'done', label: 'Ended' },
  { value: 'all', label: 'All' },
];

const FILTER_TEST: Record<Filter, (c: LegalCase) => boolean> = {
  attention: needsAttention,
  active: (c) => !isDone(c),
  done: isDone,
  all: () => true,
};

/** Tenancies a case can be brought on: signed at some point. */
const CASEABLE = new Set(['signed', 'active', 'expired', 'terminated']);

/**
 * Legal cases, arranged around what needs doing: a claim that cannot be filed
 * yet, a filed case with no next date, a decision nobody has enforced.
 */
export default function LegalCases() {
  const { colors, spacing } = useTheme();
  const insets = useSafeAreaInsets();
  const [filter, setFilter] = useState<Filter>('attention');
  const [limit, setLimit] = useState(50);
  const [opening, setOpening] = useState(false);

  const list = useQuery({
    queryKey: qk.legalCases.list(limit),
    queryFn: () => legalCasesApi.list(limit),
  });
  const cases = list.data?.cases ?? [];
  const visible = cases.filter(FILTER_TEST[filter]);
  const attention = cases.filter(needsAttention).length;

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <DetailScreenHeader
        eyebrow="Tenancies"
        title="Legal cases"
        subtitle={
          list.data
            ? attention > 0
              ? `${attention} of ${cases.length} need${attention === 1 ? 's' : ''} attention`
              : `${cases.length} case${cases.length === 1 ? '' : 's'}, none needing attention`
            : 'Evictions, recovery and disputes'
        }
        onBack={() => goBack()}
        accessory={
          <IconButton
            onPress={() => setOpening(true)}
            accessibilityLabel="Open a case"
            icon={<Plus size={20} color={colors.primary} />}
          />
        }
      />

      <QueryState
        query={list}
        skeleton={<ListSkeleton rows={3} variant="card" height={104} />}
        errorTitle="We couldn't load your cases"
        style={{ paddingHorizontal: spacing.xl }}
      >
        <FlashList
          data={visible}
          keyExtractor={(c) => c.id}
          ListHeaderComponent={
            <View style={{ marginBottom: spacing.lg }}>
              <SegmentedControl
                options={FILTERS}
                value={filter}
                onChange={setFilter}
                accessibilityLabel="Show cases"
              />
            </View>
          }
          renderItem={({ item }: { item: LegalCase }) => <CaseRow legalCase={item} />}
          contentContainerStyle={{
            paddingHorizontal: spacing.xl,
            paddingBottom: insets.bottom + spacing['3xl'],
          }}
          refreshControl={
            <RefreshControl
              refreshing={list.isRefetching}
              onRefresh={() => list.refetch()}
              tintColor={colors.mutedForeground}
            />
          }
          ListFooterComponent={
            list.data?.truncated ? (
              <Button
                label="Show more"
                variant="ghost"
                onPress={() => setLimit(limit + 50)}
                loading={list.isFetching}
              />
            ) : null
          }
          ListEmptyComponent={
            <EmptyState
              icon={<Scale size={32} color={colors.mutedForeground} />}
              title={
                filter === 'attention'
                  ? 'Nothing needs attention'
                  : cases.length
                    ? 'No cases here'
                    : 'No cases yet'
              }
              description={
                filter === 'attention'
                  ? 'Every case has a next step.'
                  : 'Open a case when a matter is heading to court.'
              }
            />
          }
        />
      </QueryState>

      <Sheet open={opening} onClose={() => setOpening(false)} title="Open a case">
        <OpenCaseForm
          key={opening ? 'open' : 'closed'}
          onDone={(id) => {
            setOpening(false);
            router.push(`/(app)/legal-case/${id}`);
          }}
        />
      </Sheet>
    </View>
  );
}

function CaseRow({ legalCase: c }: { legalCase: LegalCase }) {
  const { colors, spacing } = useTheme();
  const next = nextLine(c, (iso) => formatDate(iso, 'short'));
  const who = [c.unitName, c.tenantName].filter(Boolean).join(' · ');
  return (
    <PressableScale
      onPress={() => router.push(`/(app)/legal-case/${c.id}`)}
      accessibilityRole="button"
      accessibilityLabel={`${c.kindLabel}, ${c.property.address}, ${LEGAL_STATUS[c.status].label}`}
      style={{ marginBottom: spacing.sm }}
    >
      <Card padding={spacing.lg} style={{ gap: 4 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
          <Text variant="bodyStrong" style={{ flex: 1 }} numberOfLines={1}>
            {c.kindLabel}
          </Text>
          <Badge label={LEGAL_STATUS[c.status].label} tone={LEGAL_STATUS[c.status].tone} />
        </View>
        <Text variant="callout" color="mutedForeground" numberOfLines={2}>
          {c.description}
        </Text>
        <Text variant="caption" color="mutedForeground" numberOfLines={1}>
          {c.property.address}
          {who ? ` · ${who}` : ''}
        </Text>
        <Text
          variant="caption"
          style={{
            color: next.warn ? colors.warning : colors.mutedForeground,
            fontWeight: next.warn ? '600' : '400',
          }}
        >
          {next.text}
        </Text>
      </Card>
    </PressableScale>
  );
}

function OpenCaseForm({ onDone }: { onDone: (id: string) => void }) {
  const { spacing } = useTheme();
  const qc = useQueryClient();
  const toast = useToast();
  const [kind, setKind] = useState<LegalCaseKind>('EVICTION');
  const [leaseId, setLeaseId] = useState('');
  const [propertyId, setPropertyId] = useState('');
  const [description, setDescription] = useState('');

  const leases = useQuery({
    queryKey: qk.landlord.leases(1, 100),
    queryFn: () => landlordApi.leases(1, 100),
  });
  const homes = useMyHomes();
  const tenancies = (leases.data?.items ?? []).filter((l) => CASEABLE.has(l.status));
  const lease = tenancies.find((l) => l.id === leaseId);
  const needsLease = kind === 'EVICTION';

  const blocker = openBlocker({ kind, leaseId, propertyId, description });

  const open = useMutation({
    mutationFn: () =>
      legalCasesApi.open({
        kind,
        propertyId: lease?.propertyId ?? propertyId,
        ...(leaseId ? { leaseId } : {}),
        description: description.trim(),
      }),
    onSuccess: (c) => {
      qc.invalidateQueries({ queryKey: qk.legalCases.all });
      toast.show('Case opened.', 'success');
      onDone(c.id);
    },
    onError: (e) => toast.show(errorMessage(e, 'Could not open the case.'), 'error'),
  });

  return (
    <View style={{ gap: spacing.lg }}>
      <ChipSelect
        label="What kind of matter"
        options={CASE_KINDS}
        value={kind}
        onChange={setKind}
      />

      <ChipSelect
        label={needsLease ? 'Which tenancy' : 'Which tenancy (optional)'}
        options={tenancies.map((l) => ({
          value: l.id,
          label: `${l.tenantName} · ${l.propertyName}${l.unitName ? ` ${l.unitName}` : ''}`,
        }))}
        value={leaseId || undefined}
        onChange={(id) => setLeaseId(id === leaseId ? '' : id)}
        emptyText={leases.isLoading ? 'Loading tenancies…' : 'No signed tenancies.'}
      />
      {needsLease && !leaseId ? (
        <FormAlert
          tone="warning"
          message="A possession claim is built on the notices served on the tenancy, so an eviction needs one. The notices are checked before anything can be filed."
        />
      ) : null}

      {!needsLease && !leaseId ? (
        <ChipSelect
          label="Which property"
          options={(homes.data ?? []).map((h) => ({ value: h.id, label: h.name }))}
          value={propertyId || undefined}
          onChange={setPropertyId}
          emptyText={homes.isLoading ? 'Loading properties…' : 'No properties.'}
        />
      ) : null}

      <TextField
        label="What the matter is"
        placeholder="Rent unpaid for two quarters and the tenant has not answered the demand letter."
        value={description}
        onChangeText={setDescription}
        multiline
        numberOfLines={3}
        hint="A sentence or two. This is the record somebody reads a year from now."
        required
      />

      {blocker && description.length > 0 ? (
        <Text variant="caption" color="mutedForeground">
          {blocker}
        </Text>
      ) : null}
      <Button
        label="Open case"
        loading={open.isPending}
        disabled={!!blocker || open.isPending}
        onPress={() => open.mutate()}
      />
    </View>
  );
}
