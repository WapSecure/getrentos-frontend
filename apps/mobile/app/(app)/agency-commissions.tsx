import { useState } from 'react';
import { RefreshControl, ScrollView, View } from 'react-native';
import { router } from 'expo-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  Badge,
  Button,
  Card,
  ListSkeleton,
  NumberField,
  Price,
  QueryState,
  Text,
  useTheme,
  useToast,
} from '@sureground/ui-native';
import { qk } from '@/lib/query/keys';
import {
  agencyFirmApi,
  rateProblem,
  splitProblem,
  type Commission,
  type CommissionTeam,
} from '@/lib/api/agencyFirm';
import { formatDay } from '@/lib/api/agency';
import { errorMessage } from '@/lib/api/client';
import { formatNaira } from '@/lib/format';
import { Sheet } from '@/components/Sheet';
import { ChipSelect } from '@/components/landlord/ChipSelect';
import { DetailScreenHeader } from '@/components/dashboard/DetailScreenHeader';
import { goBack } from '@/lib/goBack';

const STATUS = {
  EARNED: { label: 'Earned', tone: 'info' as const },
  PAID: { label: 'Paid', tone: 'success' as const },
  VOID: { label: 'Void', tone: 'neutral' as const },
};

export default function AgencyCommissions() {
  const { colors, spacing } = useTheme();
  const insets = useSafeAreaInsets();
  const [crediting, setCrediting] = useState<Commission | null>(null);
  const summary = useQuery({ queryKey: qk.agency.commissions, queryFn: agencyFirmApi.commissions });
  const team = useQuery({
    queryKey: qk.agency.commissionTeam,
    queryFn: agencyFirmApi.commissionTeam,
  });
  const s = summary.data;

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <DetailScreenHeader
        eyebrow="Agency"
        title="Commissions"
        subtitle="Lettings and renewals your firm earns"
        onBack={() => goBack()}
      />
      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: spacing.xl,
          paddingBottom: insets.bottom + spacing['3xl'],
          gap: spacing.lg,
        }}
        keyboardShouldPersistTaps="handled"
        refreshControl={
          <RefreshControl
            refreshing={summary.isRefetching}
            onRefresh={() => {
              summary.refetch();
              team.refetch();
            }}
            tintColor={colors.mutedForeground}
          />
        }
      >
        <QueryState
          query={summary}
          skeleton={<ListSkeleton rows={3} variant="card" height={90} />}
          errorTitle="Commissions did not load"
        >
          {s ? (
            <>
              <View style={{ flexDirection: 'row', gap: spacing.sm }}>
                <Card padding={spacing.md} style={{ flex: 1, gap: 2 }}>
                  <Text variant="caption" color="mutedForeground">
                    Earned
                  </Text>
                  <Price amount={s.totals.earned} variant="bodyStrong" />
                  <Text variant="caption" color="mutedForeground">
                    {s.totals.count} deal{s.totals.count === 1 ? '' : 's'}
                  </Text>
                </Card>
                <Card padding={spacing.md} style={{ flex: 1, gap: 2 }}>
                  <Text variant="caption" color="mutedForeground">
                    Paid
                  </Text>
                  <Price amount={s.totals.paid} variant="bodyStrong" />
                </Card>
              </View>
              <Button
                label="Payouts"
                variant="secondary"
                onPress={() => router.push('/(app)/agency-payouts')}
              />
              <RateCard letting={s.config.lettingPct} renewal={s.config.renewalPct} />
              <View style={{ gap: spacing.sm }}>
                <Text variant="heading">Ledger</Text>
                {s.commissions.length === 0 ? (
                  <Text variant="callout" color="mutedForeground">
                    No commissions earned yet.
                  </Text>
                ) : (
                  s.commissions.map((c) => (
                    <Card key={c.id} padding={spacing.md} style={{ gap: 4 }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
                        <Text
                          variant="callout"
                          style={{ flex: 1, fontWeight: '600' }}
                          numberOfLines={1}
                        >
                          {c.type === 'LETTING' ? 'Letting' : 'Renewal'} ·{' '}
                          {c.propertyTitle ?? 'Property'}
                        </Text>
                        <Badge label={STATUS[c.status].label} tone={STATUS[c.status].tone} />
                      </View>
                      <Text variant="caption" color="mutedForeground">
                        {c.ownerName ?? 'Owner'} · {formatDay(c.earnedAt)} · {c.ratePct}% of{' '}
                        {formatNaira(c.baseAmount)} = {formatNaira(c.amount)}
                      </Text>
                      <Text variant="caption" color="mutedForeground">
                        Credited to {c.attributedName ?? 'nobody'}
                        {c.agentShareAmount
                          ? ` · agent share ${formatNaira(c.agentShareAmount)}`
                          : ''}
                      </Text>
                      {c.status === 'EARNED' ? (
                        <Button
                          label="Credit an agent"
                          size="sm"
                          variant="ghost"
                          onPress={() => setCrediting(c)}
                          style={{ alignSelf: 'flex-start' }}
                        />
                      ) : null}
                    </Card>
                  ))
                )}
              </View>
            </>
          ) : null}
        </QueryState>
        {team.data ? <Splits team={team.data} /> : null}
      </ScrollView>
      <Sheet open={!!crediting} onClose={() => setCrediting(null)} title="Credit an agent">
        {crediting && team.data ? (
          <CreditForm
            key={crediting.id}
            commission={crediting}
            team={team.data}
            onDone={() => setCrediting(null)}
          />
        ) : null}
      </Sheet>
    </View>
  );
}

function RateCard({ letting, renewal }: { letting: number; renewal: number }) {
  const { spacing } = useTheme();
  const qc = useQueryClient();
  const toast = useToast();
  const [editing, setEditing] = useState(false);
  const [l, setL] = useState(String(letting));
  const [r, setR] = useState(String(renewal));
  const problem = rateProblem(l, r);
  const save = useMutation({
    mutationFn: () => agencyFirmApi.setRates(Number(l), Number(r)),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk.agency.commissions });
      toast.show('Rate card updated.', 'success');
      setEditing(false);
    },
    onError: (e) => toast.show(errorMessage(e, 'Could not update the rate card.'), 'error'),
  });
  return (
    <Card style={{ gap: spacing.md }}>
      <Text variant="heading">Rate card</Text>
      {editing ? (
        <>
          <NumberField label="Letting (%)" value={l} onValueChange={setL} />
          <NumberField label="Renewal (%)" value={r} onValueChange={setR} />
          {problem ? (
            <Text variant="caption" color="mutedForeground">
              {problem}
            </Text>
          ) : null}
          <View style={{ flexDirection: 'row', gap: spacing.sm }}>
            <Button
              label="Save rates"
              size="sm"
              loading={save.isPending}
              disabled={!!problem || save.isPending}
              onPress={() => save.mutate()}
            />
            <Button label="Cancel" size="sm" variant="ghost" onPress={() => setEditing(false)} />
          </View>
        </>
      ) : (
        <>
          <Text variant="callout" color="mutedForeground">
            Letting {letting}% · renewal {renewal}%
          </Text>
          <Button
            label="Edit rates"
            size="sm"
            variant="secondary"
            onPress={() => setEditing(true)}
            style={{ alignSelf: 'flex-start' }}
          />
        </>
      )}
    </Card>
  );
}

function CreditForm({
  commission: c,
  team,
  onDone,
}: {
  commission: Commission;
  team: CommissionTeam;
  onDone: () => void;
}) {
  const { spacing } = useTheme();
  const qc = useQueryClient();
  const toast = useToast();
  const [agent, setAgent] = useState(c.attributedUserId ?? 'NONE');
  const save = useMutation({
    mutationFn: () => agencyFirmApi.creditAgent(c.id, agent === 'NONE' ? null : agent),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk.agency.commissions });
      qc.invalidateQueries({ queryKey: qk.agency.commissionTeam });
      toast.show('Saved.', 'success');
      onDone();
    },
    onError: () => toast.show('Could not credit the agent.', 'error'),
  });
  return (
    <View style={{ gap: spacing.lg }}>
      <Text variant="callout" color="mutedForeground">
        {formatNaira(c.amount)} on {c.propertyTitle ?? 'the property'}. The agent’s share follows
        their split.
      </Text>
      <ChipSelect
        label="Credited to"
        options={[
          { value: 'NONE', label: 'Unassigned' },
          ...team.members.map((m) => ({ value: m.userId, label: m.name })),
        ]}
        value={agent}
        onChange={setAgent}
      />
      <Button
        label="Save"
        loading={save.isPending}
        disabled={save.isPending}
        onPress={() => save.mutate()}
      />
    </View>
  );
}

function Splits({ team }: { team: CommissionTeam }) {
  const { spacing } = useTheme();
  return (
    <Card style={{ gap: spacing.md }}>
      <Text variant="heading">Agent splits</Text>
      <Text variant="caption" color="mutedForeground">
        The share of a credited commission paid to the agent.
      </Text>
      {team.members.map((m) => (
        <SplitRow key={`${m.userId}-${m.splitPct}`} member={m} />
      ))}
      {team.unassigned.deals > 0 ? (
        <Text variant="caption" color="mutedForeground">
          Unassigned: {team.unassigned.deals} deal{team.unassigned.deals === 1 ? '' : 's'},{' '}
          {formatNaira(team.unassigned.commissionTotal)}
        </Text>
      ) : null}
    </Card>
  );
}

function SplitRow({ member: m }: { member: CommissionTeam['members'][number] }) {
  const { spacing } = useTheme();
  const qc = useQueryClient();
  const toast = useToast();
  const [value, setValue] = useState(String(m.splitPct));
  const problem = splitProblem(value);
  const save = useMutation({
    mutationFn: () => agencyFirmApi.setSplit(m.userId, Number(value)),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk.agency.commissionTeam });
      toast.show('Split updated.', 'success');
    },
    onError: (e) => toast.show(errorMessage(e, 'Could not update the split.'), 'error'),
  });
  return (
    <View style={{ gap: spacing.xs }}>
      <Text variant="callout" style={{ fontWeight: '600' }}>
        {m.name}
      </Text>
      <Text variant="caption" color="mutedForeground">
        {m.deals} deal{m.deals === 1 ? '' : 's'} · {formatNaira(m.commissionTotal)} · share{' '}
        {formatNaira(m.shareTotal)}
      </Text>
      <View style={{ flexDirection: 'row', gap: spacing.sm, alignItems: 'flex-end' }}>
        <View style={{ flex: 1 }}>
          <NumberField label="Split (%)" value={value} onValueChange={setValue} />
        </View>
        {value !== String(m.splitPct) ? (
          <Button
            label="Save"
            size="sm"
            loading={save.isPending}
            disabled={!!problem || save.isPending}
            onPress={() => save.mutate()}
          />
        ) : null}
      </View>
    </View>
  );
}
