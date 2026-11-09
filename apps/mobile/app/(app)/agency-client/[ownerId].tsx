import { useState } from 'react';
import { Linking, RefreshControl, ScrollView, View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Mail, Phone } from 'lucide-react-native';
import {
  Badge,
  Button,
  Card,
  DetailSkeleton,
  Price,
  QueryState,
  Text,
  TextField,
  useTheme,
  useToast,
} from '@sureground/ui-native';
import { qk } from '@/lib/query/keys';
import {
  agencyApi,
  CLIENT_STAGES,
  ENTRY_TYPE_LABEL,
  formatDay,
  MANDATE_STATUS,
  type AgencyClient,
  type ClientStage,
} from '@/lib/api/agency';
import { useOptimisticMutation } from '@/lib/query/optimistic';
import { formatNaira } from '@/lib/format';
import { ChipSelect } from '@/components/landlord/ChipSelect';
import { DetailScreenHeader } from '@/components/dashboard/DetailScreenHeader';
import { goBack } from '@/lib/goBack';

export default function AgencyClientScreen() {
  const { ownerId } = useLocalSearchParams<{ ownerId: string }>();
  const { colors, spacing } = useTheme();
  const insets = useSafeAreaInsets();
  const q = useQuery({
    queryKey: qk.agency.client(ownerId),
    queryFn: () => agencyApi.client(ownerId),
    enabled: !!ownerId,
  });
  const c = q.data;

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <DetailScreenHeader
        eyebrow="Client"
        title={c?.ownerName ?? 'Client'}
        subtitle={c?.companyName ?? undefined}
        onBack={() => goBack()}
      />
      <QueryState
        query={q}
        skeleton={<DetailSkeleton />}
        errorTitle="This client did not load"
        style={{ paddingHorizontal: spacing.xl }}
      >
        {c ? (
          <ScrollView
            contentContainerStyle={{
              paddingHorizontal: spacing.xl,
              paddingBottom: insets.bottom + spacing['3xl'],
              gap: spacing.lg,
            }}
            keyboardShouldPersistTaps="handled"
            refreshControl={
              <RefreshControl
                refreshing={q.isRefetching}
                onRefresh={() => q.refetch()}
                tintColor={colors.mutedForeground}
              />
            }
          >
            <Contact client={c} />
            <Stage client={c} />
            <Card style={{ gap: spacing.sm }}>
              <Text variant="heading">Properties</Text>
              {c.properties.map((p) => (
                <View
                  key={p.propertyId}
                  style={{ flexDirection: 'row', gap: spacing.sm, alignItems: 'center' }}
                >
                  <Text variant="callout" style={{ flex: 1 }} numberOfLines={1}>
                    {p.title}
                  </Text>
                  <Badge
                    label={MANDATE_STATUS[p.mandateStatus]?.label ?? p.mandateStatus}
                    tone={MANDATE_STATUS[p.mandateStatus]?.tone ?? 'neutral'}
                  />
                </View>
              ))}
            </Card>
            <Notes client={c} />
            <ClientMoneyCard ownerId={c.ownerId} />
          </ScrollView>
        ) : null}
      </QueryState>
    </View>
  );
}

function Contact({ client: c }: { client: AgencyClient }) {
  const { colors, spacing } = useTheme();
  return (
    <Card style={{ gap: spacing.sm }}>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs }}>
        {c.verificationStatus ? (
          <Badge
            label={
              c.verificationStatus === 'APPROVED' ? 'Verified' : c.verificationStatus.toLowerCase()
            }
            tone={c.verificationStatus === 'APPROVED' ? 'success' : 'neutral'}
          />
        ) : null}
        {c.trustScore !== null ? <Badge label={`Trust ${c.trustScore}`} tone="info" /> : null}
      </View>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>
        {c.email ? (
          <Button
            label={c.email}
            size="sm"
            variant="secondary"
            icon={<Mail size={14} color={colors.foreground} />}
            onPress={() => Linking.openURL(`mailto:${c.email}`)}
          />
        ) : null}
        {c.phone ? (
          <Button
            label={c.phone}
            size="sm"
            variant="secondary"
            icon={<Phone size={14} color={colors.foreground} />}
            onPress={() => Linking.openURL(`tel:${c.phone}`)}
          />
        ) : null}
      </View>
    </Card>
  );
}

function Stage({ client: c }: { client: AgencyClient }) {
  const set = useOptimisticMutation({
    mutationFn: (stage: ClientStage) => agencyApi.setClientStage(c.ownerId, stage),
    patches: () => [
      {
        queryKey: qk.agency.client(c.ownerId),
        update: (old, s) => ({ ...(old as AgencyClient), stage: s }),
      },
    ],
    errorMessage: 'Could not update stage.',
    successMessage: 'Stage updated.',
  });
  return (
    <ChipSelect
      label="Stage"
      options={CLIENT_STAGES}
      value={c.stage}
      onChange={(s) => s !== c.stage && set.mutate(s)}
    />
  );
}

function Notes({ client: c }: { client: AgencyClient }) {
  const { spacing } = useTheme();
  const qc = useQueryClient();
  const toast = useToast();
  const [content, setContent] = useState('');
  const add = useMutation({
    mutationFn: () => agencyApi.addClientNote(c.ownerId, content.trim()),
    onSuccess: (updated) => {
      qc.setQueryData(qk.agency.client(c.ownerId), updated);
      setContent('');
    },
    onError: () => toast.show('Could not add note.', 'error'),
  });
  return (
    <Card style={{ gap: spacing.md }}>
      <Text variant="heading">Notes</Text>
      {c.notes.length === 0 ? (
        <Text variant="callout" color="mutedForeground">
          No notes yet. Notes are shared with your firm.
        </Text>
      ) : (
        c.notes.map((n) => (
          <View key={n.id} style={{ gap: 2 }}>
            <Text variant="callout">{n.content}</Text>
            <Text variant="caption" color="mutedForeground">
              {n.authorName ?? 'Team member'} · {formatDay(n.createdAt)}
            </Text>
          </View>
        ))
      )}
      <TextField placeholder="Add a note" value={content} onChangeText={setContent} multiline />
      <Button
        label="Add"
        size="sm"
        loading={add.isPending}
        disabled={!content.trim() || add.isPending}
        onPress={() => add.mutate()}
        style={{ alignSelf: 'flex-start' }}
      />
    </Card>
  );
}

function ClientMoneyCard({ ownerId }: { ownerId: string }) {
  const { colors, spacing } = useTheme();
  const q = useQuery({
    queryKey: qk.agency.clientMoney(ownerId),
    queryFn: () => agencyApi.clientMoney(ownerId),
  });
  const m = q.data;
  if (!m) return null;
  return (
    <Card style={{ gap: spacing.md }}>
      <Text variant="heading">Client money held</Text>
      {m.balance === null ? (
        <Text variant="callout" color="mutedForeground">
          No money has moved through your account for this client yet.
        </Text>
      ) : (
        <>
          <Price amount={m.balance} variant="display" />
          <Text
            variant="caption"
            style={{ color: m.inSync ? colors.success : colors.warning, fontWeight: '600' }}
          >
            {m.inSync ? 'Reconciled' : `Drift: ledger sums to ${formatNaira(m.reconciledBalance)}`}
          </Text>
        </>
      )}
      <Text variant="caption" color="mutedForeground">
        {m.protection
          ? `Protected under ${m.protection.schemeName}${m.protection.coverageAmount ? ` up to ${formatNaira(m.protection.coverageAmount)}` : ''}.`
          : 'No client-money protection on record.'}
      </Text>
      {m.entries.slice(0, 20).map((e, i) => (
        <View key={`${e.occurredAt}-${i}`} style={{ flexDirection: 'row', gap: spacing.sm }}>
          <View style={{ flex: 1 }}>
            <Text variant="callout">{ENTRY_TYPE_LABEL[e.entryType] ?? e.entryType}</Text>
            <Text variant="caption" color="mutedForeground" numberOfLines={1}>
              {formatDay(e.occurredAt)}
              {e.propertyTitle ? ` · ${e.propertyTitle}` : ''} · balance{' '}
              {formatNaira(e.balanceAfter)}
            </Text>
          </View>
          <Price
            amount={e.amount}
            variant="callout"
            color={e.amount < 0 ? 'destructive' : 'success'}
          />
        </View>
      ))}
    </Card>
  );
}
