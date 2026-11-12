import { useRef, useState } from 'react';
import {
  Alert,
  RefreshControl,
  ScrollView,
  View,
  type LayoutChangeEvent,
  type ScrollViewInstance,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as WebBrowser from 'expo-web-browser';
import { ArrowRight, Clock, ExternalLink, Lock, ShieldCheck } from '@sureground/icons/native';
import {
  Badge,
  Button,
  Card,
  DetailSkeleton,
  Divider,
  FormAlert,
  LinkButton,
  QueryState,
  Text,
  useTheme,
  useToast,
} from '@sureground/ui-native';
import {
  canReleaseDeposit,
  documentLinkLabel,
  formatDualTime,
  humaniseCode,
  moneyVariant,
  nextActionTarget,
  releaseOutcome,
  workspaceProgress,
  type WorkspaceSection,
} from '@sureground/shared';
import { qk } from '@/lib/query/keys';
import {
  purchaseWorkspaceApi,
  type TransactionWorkspace,
  type WorkspaceCondition,
  type WorkspaceProfessional,
  type WorkspaceViewer,
} from '@/lib/api/purchaseWorkspace';
import { buyerTransactionsApi } from '@/lib/api/buyerTransactions';
import { landBuyerApi } from '@/lib/api/landBuyer';
import { deviceTimeZone, REP_RELATIONSHIPS } from '@/lib/api/landBuyerExtras';
import type { ClosingCondition } from '@/lib/api/landSales';
import { errorMessage } from '@/lib/api/client';
import { formatDate } from '@/lib/format';
import { goBack } from '@/lib/goBack';
import { DetailScreenHeader } from '@/components/dashboard/DetailScreenHeader';
import { BuyerConditions, BuyerMilestones } from '@/components/land/BuyerConveyance';
import { CoApprovalCard } from '@/components/land/LandRequests';
import { TitlePerfection } from '@/components/land/TitlePerfection';
import { AcquisitionStatusBadges } from '@/components/purchases/AcquisitionStatusBadges';
import { DepositPaySheet } from '@/components/purchases/DepositPaySheet';
import { StepProgress } from '@/components/purchases/StepProgress';

const PLAN_LABEL: Record<TransactionWorkspace['plan'], string> = {
  BUILT_HOME: 'Built home',
  LAND_RESALE: 'Land resale',
};

const PROFESSIONAL_LABEL: Record<WorkspaceProfessional['role'], string> = {
  SURVEYOR: 'Surveyor',
  LAWYER: 'Lawyer',
  VALUER: 'Valuer',
  INSPECTOR: 'Inspector',
};

const SCOPE_SHORT: Record<string, string> = {
  VIEW: 'See purchases',
  CO_APPROVE: 'Approve the release',
  ATTEND: 'Attend visits',
};

const CTA_LABEL: Record<WorkspaceSection, string> = {
  approvals: 'Give your approval',
  deposit: 'Review the deposit',
  steps: 'Review the steps',
};

/** History shown before "Show all": the workspace is a glance, the record is on request. */
const HISTORY_INITIAL = 5;

/** The workspace's lean condition, in the shape the shared conditions list reads. */
const toClosingCondition = (c: WorkspaceCondition): ClosingCondition => {
  const known = ['PENDING', 'DELIVERED', 'SATISFIED', 'WAIVED'] as const;
  const status = (known as readonly string[]).includes(c.status)
    ? (c.status as ClosingCondition['status'])
    : 'PENDING';
  return {
    key: c.key,
    label: c.label,
    status,
    failed: c.status === 'FAILED',
    deadline: c.deadline,
    remedy: c.remedy,
    note: c.remedy ? `If it is not met: ${c.remedy}` : undefined,
    deliveredByDeveloper: false,
  };
};

/**
 * One purchase as its buyer or the buyer's representative sees it (DIA-15): three separate
 * statuses, the next action, the steps, the legal transfer, approvals, people, documents and
 * history. Sureground holds only the deposit under Payment Protection, never the rest of the
 * price (D11), so nothing here says the price is held.
 */
export default function PurchaseWorkspace() {
  const { txId, role: roleParam } = useLocalSearchParams<{ txId: string; role?: string }>();
  const role: WorkspaceViewer = roleParam === 'representative' ? 'REPRESENTATIVE' : 'BUYER';
  const { colors, spacing } = useTheme();
  const insets = useSafeAreaInsets();
  const qc = useQueryClient();
  const toast = useToast();
  const scroller = useRef<ScrollViewInstance>(null);
  const sectionY = useRef<Partial<Record<WorkspaceSection, number>>>({});
  const [viewerTimeZone] = useState(deviceTimeZone);
  const [releaseNotice, setReleaseNotice] = useState<string | null>(null);
  const [paying, setPaying] = useState(false);
  const key = qk.purchaseWorkspace.detail(role, txId);

  const workspace = useQuery({
    queryKey: key,
    queryFn: () => purchaseWorkspaceApi.get(role, txId),
    enabled: Boolean(txId),
  });
  const data = workspace.data;
  const isBuyer = data?.viewer.role === 'BUYER';
  // The deposit amount and seller come from the buyer's own transaction, not the workspace.
  const transactions = useQuery({
    queryKey: qk.buyer.transactions(1, 50),
    queryFn: () => buyerTransactionsApi.list(1, 50),
    enabled: isBuyer && data?.statuses.moneyStatus.code === 'REQUESTED',
  });
  const payTx = transactions.data?.items.find((t) => t.id === txId) ?? null;

  const refresh = () => {
    void qc.invalidateQueries({ queryKey: key });
    void qc.invalidateQueries({ queryKey: ['buyer', 'transactions'] });
    void qc.invalidateQueries({ queryKey: qk.investor.overview });
  };
  const labelFor = (milestoneKey: string) =>
    data?.milestones.find((m) => m.key === milestoneKey)?.label ?? humaniseCode(milestoneKey);

  const confirm = useMutation({
    mutationFn: (milestoneKey: string) =>
      purchaseWorkspaceApi.confirmMilestone(txId, milestoneKey, labelFor(milestoneKey)),
    onSuccess: (updated) => {
      refresh();
      // Under two-person approval the step stays delivered until the representative approves too.
      toast.show(
        updated.status === 'DELIVERED'
          ? 'Your approval is recorded. Waiting for your representative.'
          : 'Step confirmed.',
        'success'
      );
    },
    onError: (e) => toast.show(errorMessage(e, 'Could not confirm that step.'), 'error'),
  });
  const dispute = useMutation({
    mutationFn: ({ milestoneKey, reason }: { milestoneKey: string; reason: string }) =>
      purchaseWorkspaceApi.disputeMilestone(txId, milestoneKey, reason),
    onSuccess: () => {
      refresh();
      toast.show('Dispute sent to the seller.', 'success');
    },
    onError: (e) => toast.show(errorMessage(e, 'Could not send the dispute.'), 'error'),
  });
  const settle = useMutation({
    mutationFn: ({ conditionKey, how }: { conditionKey: string; how: 'confirm' | 'waive' }) =>
      landBuyerApi.settleResaleCondition(txId, conditionKey, how),
    onSuccess: (_next, { how }) => {
      refresh();
      toast.show(how === 'confirm' ? 'Condition confirmed.' : 'Condition waived.', 'success');
    },
    onError: (e) => toast.show(errorMessage(e, 'That did not go through.'), 'error'),
  });
  const release = useMutation({
    mutationFn: () =>
      purchaseWorkspaceApi.releaseDeposit(txId, data?.propertyTitle ?? 'this purchase'),
    onSuccess: (result) => {
      const outcome = releaseOutcome(result.release);
      // Waiting for the second approval: nothing moved, so the message stays on the screen.
      setReleaseNotice(outcome.waiting ? outcome.message : null);
      refresh();
      toast.show(outcome.message, 'success');
    },
    onError: (e) => toast.show(errorMessage(e, 'Could not release the deposit.'), 'error'),
  });
  const openDocument = useMutation({
    mutationFn: (documentId: string) => purchaseWorkspaceApi.document(role, txId, documentId),
    onSuccess: (link) => void WebBrowser.openBrowserAsync(link.url),
    onError: (e) => toast.show(errorMessage(e, 'Could not open the document.'), 'error'),
  });

  const confirmRelease = () =>
    Alert.alert(
      'Release the deposit to the seller?',
      'Release only once you have received the property and the documents you agreed; it cannot be undone. If two-person approval is on, nothing moves until your representative approves too. This does not complete the legal transfer.',
      [
        { text: 'Not yet', style: 'cancel' },
        { text: 'Release the deposit', onPress: () => release.mutate() },
      ]
    );

  const scrollTo = (section: WorkspaceSection) => {
    const y = sectionY.current[section];
    if (y !== undefined)
      scroller.current?.scrollTo({ y: Math.max(0, y - spacing.md), animated: true });
  };

  const isRepresentative = data?.viewer.role === 'REPRESENTATIVE';
  const isLandResale = data?.plan === 'LAND_RESALE';
  const overdue = data ? data.delays.overdueMilestones + data.delays.overdueLegalSteps : 0;
  const progress = data ? workspaceProgress(data) : null;
  const target = data ? nextActionTarget(data) : null;
  const releasable = data ? canReleaseDeposit(data) : false;

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <DetailScreenHeader
        eyebrow={
          data
            ? `${PLAN_LABEL[data.plan] ?? humaniseCode(data.plan)}${isRepresentative ? ' · You represent the buyer' : ''}`
            : 'Purchase'
        }
        title={data?.propertyTitle ?? 'Purchase'}
        onBack={() => goBack()}
      />
      <QueryState
        query={workspace}
        skeleton={<DetailSkeleton />}
        errorTitle="This purchase is not available to you"
        errorDescription={
          workspace.error
            ? errorMessage(workspace.error, 'Check your connection, then try again.')
            : undefined
        }
      >
        {data && progress ? (
          <ScrollView
            ref={scroller}
            contentContainerStyle={{
              paddingHorizontal: spacing.xl,
              paddingBottom: insets.bottom + spacing['3xl'],
              gap: spacing.lg,
            }}
            keyboardShouldPersistTaps="handled"
            refreshControl={
              <RefreshControl
                refreshing={workspace.isRefetching}
                onRefresh={() => void workspace.refetch()}
                tintColor={colors.mutedForeground}
              />
            }
          >
            {/* The three statuses and what happens next. */}
            <Card style={{ gap: spacing.md }}>
              <AcquisitionStatusBadges statuses={data.statuses} />
              {data.nextAction ? (
                <Text
                  variant="callout"
                  color={data.nextAction.waitingForYou ? 'foreground' : 'mutedForeground'}
                >
                  <Text variant="callout" color="mutedForeground">
                    {data.nextAction.waitingForYou ? 'Waiting for you: ' : 'Next: '}
                  </Text>
                  {data.nextAction.label}
                </Text>
              ) : null}
              {target ? (
                <Button
                  label={CTA_LABEL[target]}
                  iconRight={<ArrowRight size={16} color={colors.primaryForeground} />}
                  onPress={() => scrollTo(target)}
                />
              ) : null}
              <Divider />
              {progress.steps.total > 0 ? (
                <StepProgress
                  label="Purchase steps"
                  done={progress.steps.done}
                  total={progress.steps.total}
                />
              ) : (
                <Summary title="Purchase steps" detail="Not set up yet" />
              )}
              {progress.legal.total > 0 ? (
                <StepProgress
                  label="Legal transfer"
                  done={progress.legal.done}
                  total={progress.legal.total}
                />
              ) : (
                <Summary title="Legal transfer" detail={data.statuses.legalStatus.label} />
              )}
              <Summary title="Deposit" detail={data.statuses.moneyStatus.note} />
            </Card>

            {releaseNotice ? (
              <FormAlert
                tone="info"
                title="Nothing has been released yet"
                message={releaseNotice}
              />
            ) : null}

            {overdue > 0 ? (
              <FormAlert
                tone={data.delays.escalated ? 'error' : 'warning'}
                message={`${[
                  data.delays.overdueMilestones > 0
                    ? `${data.delays.overdueMilestones} step${data.delays.overdueMilestones === 1 ? ' is' : 's are'} late`
                    : null,
                  data.delays.overdueLegalSteps > 0
                    ? `${data.delays.overdueLegalSteps} legal step${data.delays.overdueLegalSteps === 1 ? ' is' : 's are'} late`
                    : null,
                ]
                  .filter(Boolean)
                  .join(' and ')}.${
                  data.delays.escalated
                    ? ' A step is more than 30 days late and has been escalated to Sureground.'
                    : ''
                }`}
              />
            ) : null}

            <View
              onLayout={(e: LayoutChangeEvent) => {
                sectionY.current.steps = e.nativeEvent.layout.y;
              }}
            >
              <Section
                title="Purchase steps"
                description={
                  !isBuyer
                    ? 'The steps of this purchase and who has confirmed them.'
                    : isLandResale
                      ? 'Confirm each step only when it has actually happened; dispute it if something is wrong.'
                      : 'Confirm each step only when it has actually happened; dispute it if something is wrong. These steps track the purchase: confirming one does not move any money.'
                }
              >
                {data.milestones.length ? (
                  <BuyerMilestones
                    milestones={data.milestones}
                    contractOpen={isBuyer}
                    requiredOnly
                    seller="seller"
                    busyKey={
                      confirm.isPending
                        ? (confirm.variables ?? null)
                        : dispute.isPending
                          ? (dispute.variables?.milestoneKey ?? null)
                          : null
                    }
                    onConfirm={(m) => confirm.mutate(m.key)}
                    onDispute={(m, reason) => dispute.mutate({ milestoneKey: m.key, reason })}
                  />
                ) : (
                  <Text variant="callout" color="mutedForeground">
                    The steps appear here once the sale is set up. The seller marks each one done,
                    then {isBuyer ? 'you confirm it' : 'the buyer confirms it'}.
                  </Text>
                )}
              </Section>
            </View>

            {data.conditions.length > 0 ? (
              <Section
                title="Conditions of the sale"
                description="What must be true before the sale can complete."
              >
                <BuyerConditions
                  conditions={data.conditions.map(toClosingCondition)}
                  seller="Seller"
                  busyKey={settle.isPending ? (settle.variables?.conditionKey ?? null) : null}
                  onSettle={
                    isBuyer && isLandResale
                      ? (conditionKey, how) => settle.mutate({ conditionKey, how })
                      : undefined
                  }
                />
              </Section>
            ) : null}

            <View style={{ gap: spacing.sm }}>
              <Heading
                title="Legal transfer"
                description="Consent and registration with the state, step by step, with who is responsible for each."
              />
              {data.legalCase ? (
                <TitlePerfection perfection={{ ...data.legalCase, steps: data.legalSteps }} />
              ) : (
                <Card>
                  <Text variant="callout" color="mutedForeground">
                    Not started yet. Sureground opens the legal transfer for this purchase; its
                    steps then appear here with who is responsible and when each is due.
                  </Text>
                </Card>
              )}
            </View>

            <View
              onLayout={(e: LayoutChangeEvent) => {
                sectionY.current.deposit = e.nativeEvent.layout.y;
              }}
            >
              <Section
                title="Deposit"
                description="Payment Protection covers the deposit only. The rest of the price is paid outside Sureground."
              >
                <Badge
                  label={data.statuses.moneyStatus.label}
                  tone={moneyVariant(data.statuses.moneyStatus.code)}
                />
                {isBuyer && data.statuses.moneyStatus.code === 'REQUESTED' && payTx ? (
                  <Button
                    label="Pay the deposit"
                    icon={<ShieldCheck size={16} color={colors.primaryForeground} />}
                    onPress={() => setPaying(true)}
                  />
                ) : null}
                {releasable ? (
                  <>
                    <Text variant="callout" color="mutedForeground">
                      Release it only once you have received the property and the documents you
                      agreed.
                    </Text>
                    <Button
                      label="Release the deposit"
                      icon={<Lock size={16} color={colors.primaryForeground} />}
                      loading={release.isPending}
                      onPress={confirmRelease}
                    />
                  </>
                ) : null}
              </Section>
            </View>

            <View
              onLayout={(e: LayoutChangeEvent) => {
                sectionY.current.approvals = e.nativeEvent.layout.y;
              }}
            >
              <CoApprovalCard
                deal={{ kind: 'sale', id: data.transactionId }}
                viewer={isBuyer ? 'buyer' : 'representative'}
                moneyScope={isLandResale ? 'steps' : 'deposit'}
                labelFor={labelFor}
                onApproved={refresh}
              />
            </View>

            <Section
              title={isRepresentative ? 'Your appointment' : 'Representatives'}
              action={
                isBuyer && data.representatives.length > 0 ? (
                  <LinkButton
                    label="Manage"
                    onPress={() => router.push('/(app)/buyer-land-representatives')}
                  />
                ) : undefined
              }
            >
              {data.representatives.length > 0 ? (
                <Rows
                  rows={data.representatives.map((r) => ({
                    id: r.appointmentId,
                    title: r.name ?? 'Invitation sent',
                    detail: [
                      REP_RELATIONSHIPS.find((x) => x.value === r.relationship)?.label ??
                        humaniseCode(r.relationship),
                      r.scopes.map((s) => SCOPE_SHORT[s] ?? humaniseCode(s)).join(', '),
                    ].join(' · '),
                    badge: r.approvesPayments ? (
                      <Badge label="Approves" tone="info" />
                    ) : (
                      <Badge
                        label={r.status === 'ACTIVE' ? 'Active' : 'Invited'}
                        tone={r.status === 'ACTIVE' ? 'success' : 'warning'}
                      />
                    ),
                  }))}
                />
              ) : (
                <>
                  <Text variant="callout" color="mutedForeground">
                    Buying from abroad? Someone you trust in Nigeria can follow this purchase,
                    attend visits and approve the release with you.
                  </Text>
                  {isBuyer ? (
                    <Button
                      label="Appoint a representative"
                      size="sm"
                      variant="outline"
                      onPress={() => router.push('/(app)/buyer-land-representatives')}
                      style={{ alignSelf: 'flex-start' }}
                    />
                  ) : null}
                </>
              )}
            </Section>

            <Section title="Professionals">
              {data.professionals.length > 0 ? (
                <Rows
                  rows={data.professionals.map((p, index) => ({
                    id: `${p.role}-${index}`,
                    title: p.name,
                    detail: PROFESSIONAL_LABEL[p.role] ?? humaniseCode(p.role),
                    badge:
                      p.status === 'COMPLETED' ? (
                        <Badge
                          label={
                            p.completedAt ? `Done ${formatDate(p.completedAt, 'short')}` : 'Done'
                          }
                          tone="success"
                        />
                      ) : (
                        <Badge label="Checking" tone="info" />
                      ),
                  }))}
                />
              ) : (
                <Text variant="callout" color="mutedForeground">
                  The accredited surveyor, lawyer or inspector checking this property is named here
                  once assigned.
                </Text>
              )}
            </Section>

            <Section title="Documents">
              {data.documents.length > 0 ? (
                <Rows
                  rows={data.documents.map((d) => ({
                    id: `${d.linkedTo}-${d.key}-${d.id}`,
                    title: humaniseCode(d.documentType),
                    detail: `${documentLinkLabel(d, data)} · added ${formatDate(d.uploadedAt, 'short')}`,
                    badge: (
                      <Button
                        label="Open"
                        size="sm"
                        variant="ghost"
                        icon={<ExternalLink size={16} color={colors.foreground} />}
                        loading={openDocument.isPending && openDocument.variables === d.id}
                        disabled={openDocument.isPending}
                        onPress={() => openDocument.mutate(d.id)}
                        accessibilityLabel={`Open ${humaniseCode(d.documentType)}`}
                      />
                    ),
                  }))}
                />
              ) : (
                <Text variant="callout" color="mutedForeground">
                  Evidence appears here as the seller delivers each step and the legal transfer
                  moves on.
                </Text>
              )}
            </Section>

            <History items={data.history} viewerTimeZone={viewerTimeZone} />
          </ScrollView>
        ) : null}
      </QueryState>
      {isBuyer ? (
        <DepositPaySheet
          tx={payTx}
          open={paying}
          onClose={() => setPaying(false)}
          onSettled={refresh}
        />
      ) : null}
    </View>
  );
}

function Heading({ title, description }: { title: string; description?: string }) {
  return (
    <View style={{ gap: 2 }}>
      <Text variant="subheading" accessibilityRole="header">
        {title}
      </Text>
      {description ? (
        <Text variant="caption" color="mutedForeground">
          {description}
        </Text>
      ) : null}
    </View>
  );
}

function Section({
  title,
  description,
  action,
  children,
}: {
  title: string;
  description?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  const { spacing } = useTheme();
  return (
    <Card style={{ gap: spacing.md }}>
      <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm }}>
        <View style={{ flex: 1 }}>
          <Heading title={title} description={description} />
        </View>
        {action}
      </View>
      {children}
    </Card>
  );
}

function Summary({ title, detail }: { title: string; detail: string }) {
  return (
    <View style={{ gap: 2 }}>
      <Text variant="caption" color="mutedForeground">
        {title}
      </Text>
      <Text variant="callout">{detail}</Text>
    </View>
  );
}

/** A name, a line under it and a badge or action on the right. */
function Rows({
  rows,
}: {
  rows: { id: string; title: string; detail?: string; badge?: React.ReactNode }[];
}) {
  const { spacing } = useTheme();
  return (
    <View style={{ gap: spacing.sm }}>
      {rows.map((row, index) => (
        <View key={row.id} style={{ gap: spacing.sm }}>
          {index > 0 ? <Divider /> : null}
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
            <View style={{ flex: 1, gap: 2 }}>
              <Text variant="callout" style={{ fontWeight: '600' }} numberOfLines={1}>
                {row.title}
              </Text>
              {row.detail ? (
                <Text variant="caption" color="mutedForeground">
                  {row.detail}
                </Text>
              ) : null}
            </View>
            {row.badge}
          </View>
        </View>
      ))}
    </View>
  );
}

/** Everything recorded on the purchase, newest first, with Lagos time next to the viewer's. */
function History({
  items,
  viewerTimeZone,
}: {
  items: TransactionWorkspace['history'];
  viewerTimeZone: string;
}) {
  const { colors, spacing } = useTheme();
  const [all, setAll] = useState(false);
  const ordered = [...items].sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime());
  const shown = all ? ordered : ordered.slice(0, HISTORY_INITIAL);
  return (
    <Section
      title="History"
      description="Everything recorded on this purchase. Times show Lagos time next to yours."
    >
      {ordered.length === 0 ? (
        <Text variant="callout" color="mutedForeground">
          Each step, approval and payment on this purchase is recorded here as it happens.
        </Text>
      ) : (
        <>
          {shown.map((item, index) => (
            <View key={item.id} style={{ gap: spacing.sm }}>
              {index > 0 ? <Divider /> : null}
              <View style={{ flexDirection: 'row', gap: spacing.sm }}>
                <Clock
                  size={14}
                  color={item.important ? colors.primary : colors.mutedForeground}
                  style={{ marginTop: 3 }}
                />
                <View style={{ flex: 1, gap: 2 }}>
                  <Text
                    variant="callout"
                    style={item.important ? { fontWeight: '600' } : undefined}
                  >
                    {item.label}
                  </Text>
                  <Text
                    variant="caption"
                    color="mutedForeground"
                    style={{ fontVariant: ['tabular-nums'] }}
                  >
                    {item.actor} · {formatDate(item.at, 'short')} ·{' '}
                    {formatDualTime(item.at, viewerTimeZone)}
                  </Text>
                </View>
              </View>
            </View>
          ))}
          {ordered.length > HISTORY_INITIAL ? (
            <LinkButton
              label={all ? 'Show less' : `Show all ${ordered.length}`}
              onPress={() => setAll((v) => !v)}
            />
          ) : null}
        </>
      )}
    </Section>
  );
}
