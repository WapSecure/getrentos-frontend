import { RefreshControl, ScrollView, View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CheckCircle2, Circle } from 'lucide-react-native';
import { Badge, Card, DetailSkeleton, ErrorState, Text, useTheme } from '@getrentos/ui-native';
import { qk } from '@/lib/query/keys';
import {
  agencyApi,
  formatDay,
  isLive,
  MANDATE_STATUS,
  managerLabel,
  noticeEndsAt,
  noticeSummary,
  SCOPE_LABEL,
  TERMINATION_REQUEST_LABEL,
  type Mandate,
} from '@/lib/api/agency';
import { ApiError } from '@/lib/api/client';
import { formatDateTime } from '@/lib/format';
import { MandateActions } from '@/components/agency/MandateActions';
import { DetailScreenHeader } from '@/components/dashboard/DetailScreenHeader';
import { goBack } from '@/lib/goBack';

/** One engagement: its terms, what it allows, its history, and what can be done now. */
export default function AgencyMandate() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { colors, spacing } = useTheme();
  const insets = useSafeAreaInsets();
  const q = useQuery({
    queryKey: qk.agency.mandate(id),
    queryFn: () => agencyApi.mandate(id),
    enabled: !!id,
  });
  const requests = useQuery({
    queryKey: qk.agency.terminationRequests(id),
    queryFn: () => agencyApi.terminationRequests(id),
    enabled: !!id,
  });
  const m = q.data;

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <DetailScreenHeader
        eyebrow="Engagement"
        title={m?.propertyTitle ?? 'Engagement'}
        subtitle={m ? `For ${m.ownerName ?? 'the owner'}` : undefined}
        onBack={() => goBack()}
      />
      {!m ? (
        q.isError ? (
          <ErrorState
            title="This engagement did not load"
            description={q.error instanceof ApiError ? q.error.message : undefined}
            onRetry={() => q.refetch()}
          />
        ) : (
          <View style={{ paddingHorizontal: spacing.xl }}>
            <DetailSkeleton />
          </View>
        )
      ) : (
        <ScrollView
          contentContainerStyle={{
            paddingHorizontal: spacing.xl,
            paddingBottom: insets.bottom + spacing['3xl'],
            gap: spacing.lg,
          }}
          refreshControl={
            <RefreshControl
              refreshing={q.isRefetching}
              onRefresh={() => {
                q.refetch();
                requests.refetch();
              }}
              tintColor={colors.mutedForeground}
            />
          }
        >
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs }}>
            <Badge label={MANDATE_STATUS[m.status].label} tone={MANDATE_STATUS[m.status].tone} />
            {isLive(m) ? <Badge label="In force" tone="success" /> : null}
          </View>
          <MandateActions mandate={m} />
          <Card style={{ gap: spacing.sm }}>
            <Fact label="Owner" value={m.ownerName ?? '—'} />
            <Fact label="Manager" value={managerLabel(m)} />
            <Fact label="Notice period" value={`${m.noticePeriodDays} days`} />
            <Fact label="Term" value={term(m)} />
            <Fact label="How it ends" value={noticeSummary(m)} />
          </Card>
          <Card style={{ gap: spacing.sm }}>
            <Text variant="heading">What it covers</Text>
            {m.scope.length === 0 ? (
              <Text variant="callout" color="mutedForeground">
                No scope agreed.
              </Text>
            ) : (
              m.scope.map((s) => (
                <Text key={s} variant="callout">
                  • {SCOPE_LABEL[s]}
                </Text>
              ))
            )}
            <Text variant="caption" color="mutedForeground">
              Today it lets you {m.capabilities.canList ? '' : 'not '}list,{' '}
              {m.capabilities.canManage ? '' : 'not '}manage, and{' '}
              {m.capabilities.canTransact ? '' : 'not '}handle money.
            </Text>
            <Text variant="caption" color="mutedForeground">
              Agreement {m.agreementDocumentId ? 'attached' : 'not attached'} · power of attorney{' '}
              {m.poaDocumentId ? 'attached' : 'not attached'}
            </Text>
          </Card>
          <Timeline m={m} />
          {(requests.data ?? []).length ? (
            <Card style={{ gap: spacing.sm }}>
              <Text variant="heading">Requests to end it</Text>
              {requests.data!.map((r) => (
                <View key={r.id} style={{ gap: 2 }}>
                  <Badge
                    label={TERMINATION_REQUEST_LABEL[r.status]}
                    tone={
                      r.status === 'APPROVED'
                        ? 'success'
                        : r.status === 'PENDING'
                          ? 'warning'
                          : 'neutral'
                    }
                  />
                  <Text variant="callout">“{r.reason}”</Text>
                  <Text variant="caption" color="mutedForeground">
                    {r.requestedByName ?? 'Someone'} · {formatDay(r.createdAt)}
                    {r.decidedAt
                      ? ` · decided by ${r.decidedByName ?? 'GetRentos'} ${formatDay(r.decidedAt)}`
                      : ''}
                    {r.decisionNote ? ` · ${r.decisionNote}` : ''}
                  </Text>
                </View>
              ))}
            </Card>
          ) : null}
        </ScrollView>
      )}
    </View>
  );
}

function term(m: Mandate) {
  if (!m.startAt && !m.endAt) return 'No dates agreed';
  if (m.startAt && !m.endAt) return `From ${formatDay(m.startAt)} · rolling`;
  return `${formatDay(m.startAt)} to ${formatDay(m.endAt)}`;
}

function Fact({ label, value }: { label: string; value: string }) {
  const { spacing } = useTheme();
  return (
    <View style={{ flexDirection: 'row', gap: spacing.md }}>
      <Text variant="callout" color="mutedForeground" style={{ width: 110 }}>
        {label}
      </Text>
      <Text variant="callout" style={{ flex: 1 }}>
        {value}
      </Text>
    </View>
  );
}

function Timeline({ m }: { m: Mandate }) {
  const { colors, spacing } = useTheme();
  const at = (iso: string | null) => (iso ? formatDateTime(iso) : null);
  const steps: { label: string; when: string | null; note?: string | null }[] = [
    { label: 'Created', when: at(m.createdAt) },
    { label: m.submittedById ? 'Sent to the owner' : 'Not yet sent to the owner', when: null },
    { label: 'Signed by the owner', when: at(m.signedByOwnerAt) },
    { label: 'Signed by the manager', when: at(m.signedByManagerAt) },
    {
      label:
        m.status === 'REJECTED'
          ? 'Refused by GetRentos'
          : m.activatedAt
            ? 'Verified by GetRentos'
            : 'Awaiting verification',
      when: at(m.decidedAt ?? m.activatedAt),
      note: m.decisionNote,
    },
    ...(m.noticeServedAt
      ? [
          { label: 'Notice served', when: at(m.noticeServedAt) },
          { label: 'Notice period ends', when: at(noticeEndsAt(m)) },
        ]
      : []),
    ...(m.terminatedAt
      ? [{ label: 'Ended', when: at(m.terminatedAt), note: m.terminationReason }]
      : []),
    ...(m.status === 'TERMINATED'
      ? [
          {
            label: m.handoverAt ? 'Handover recorded' : 'Handover outstanding',
            when: at(m.handoverAt),
          },
        ]
      : []),
  ];
  return (
    <Card style={{ gap: spacing.md }}>
      <Text variant="heading">History</Text>
      {steps.map((s) => {
        const done = !!s.when;
        const Icon = done ? CheckCircle2 : Circle;
        return (
          <View key={s.label} style={{ flexDirection: 'row', gap: spacing.sm }}>
            <Icon
              size={16}
              color={done ? colors.success : colors.mutedForeground}
              style={{ marginTop: 2 }}
            />
            <View style={{ flex: 1 }}>
              <Text variant="callout" style={{ fontWeight: done ? '600' : '400' }}>
                {s.label}
              </Text>
              {s.when ? (
                <Text variant="caption" color="mutedForeground">
                  {s.when}
                </Text>
              ) : null}
              {s.note ? (
                <Text variant="caption" color="mutedForeground">
                  {s.note}
                </Text>
              ) : null}
            </View>
          </View>
        );
      })}
    </Card>
  );
}
