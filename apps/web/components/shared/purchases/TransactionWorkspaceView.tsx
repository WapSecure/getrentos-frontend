'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  canReleaseDeposit,
  releaseBlockedNote,
  depositReleaseStage,
  documentLinkLabel,
  formatDualTime,
  humaniseCode,
  moneyVariant,
  nextActionTarget,
  releaseDialogDescription,
  releaseOutcome,
  releaseStageNote,
  withStepUpSummary,
  workspaceProgress,
  type WorkspaceSection,
} from '@sureground/shared';
import {
  ArrowRight,
  Building2,
  Clock,
  FileText,
  ListChecks,
  Lock,
  MessageCircle,
  Scale,
  ShieldCheck,
  UsersRound,
} from '@sureground/icons';
import {
  Alert,
  Badge,
  Breadcrumbs,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  ConfirmDialog,
  EmptyState,
  PageErrorState,
  Progress,
  ReasonDialog,
  StatGroupSkeleton,
  useToast,
} from '@sureground/ui';
import { AcquisitionStatusBadges } from './AcquisitionStatusBadges';
import { usePurchaseDisputes } from './usePurchaseDisputes';
import {
  LAND_DISPUTE_STATUS,
  respondByText,
  SALE_DISPUTE_STATUS,
} from '@/components/shared/disputes/DisputeParts';
import { MilestoneTimeline } from '@/components/land/buyer/MilestoneTimeline';
import { ReportLandProblemDialog } from '@/components/land/disputes/ReportLandProblemDialog';
import { ConditionsPanel } from '@/components/land/closing/ConditionsPanel';
import { PerfectionPanel } from '@/components/land/closing/PerfectionPanel';
import { ActivityFeed } from '@/components/shared/activity/ActivityFeed';
import { browserTimeZone } from '@/components/shared/forms/TimeZoneSelect';
import { CoApprovalCard } from '@/components/shared/representatives/CoApprovalCard';
import { purchaseHistoryItems } from '@/lib/purchaseHistory';
import { unwrap } from '@/lib/apiHelpers';
import { ROUTES } from '@/lib/constants/auth';
import { PURCHASE_ROUTES } from '@/lib/constants/purchaseRoutes';
import { formatDate } from '@/lib/format';
import { buyerKeys, transactionWorkspaceKeys } from '@/lib/queryKeys';
import { buyerService } from '@/services/buyerService';
import { landBuyerService } from '@/services/landBuyerService';
import { transactionWorkspaceService } from '@/services/transactionWorkspaceService';
import type { LandClosingCondition } from '@/types/landClosing';
import {
  REPRESENTATIVE_RELATIONSHIP_LABELS,
  REPRESENTATIVE_SCOPE_SHORT_LABELS,
  type RepresentativeRelationship,
  type RepresentativeScope,
} from '@/types/landRepresentative';
import type {
  TransactionWorkspace,
  WorkspaceCondition,
  WorkspaceProfessional,
  WorkspaceViewerRole,
} from '@/types/transactionWorkspace';

const PLAN_LABEL: Record<TransactionWorkspace['plan'], string> = {
  BUILT_HOME: 'Built home',
  LAND_RESALE: 'Land sale',
};

const PROFESSIONAL_LABEL: Record<WorkspaceProfessional['role'], string> = {
  SURVEYOR: 'Surveyor',
  LAWYER: 'Lawyer',
  VALUER: 'Valuer',
  INSPECTOR: 'Inspector',
};

const CONDITION_STATUSES = new Set<LandClosingCondition['status']>([
  'PENDING',
  'DELIVERED',
  'SATISFIED',
  'WAIVED',
  'FAILED',
]);

/**
 * The workspace's lean condition, in the shape the shared conditions panel reads. The panel shows
 * the shared remedy once below the list, so a condition repeats it only when its own differs, and
 * never once it is met or waived.
 */
const toClosingCondition = (
  condition: WorkspaceCondition,
  _index: number,
  all: readonly WorkspaceCondition[]
): LandClosingCondition => {
  const status = CONDITION_STATUSES.has(condition.status as LandClosingCondition['status'])
    ? (condition.status as LandClosingCondition['status'])
    : 'PENDING';
  return {
    key: condition.key,
    label: condition.label,
    status,
    deadline: condition.deadline,
    failed: status === 'FAILED',
    remedy: condition.remedy,
    note:
      condition.remedy &&
      condition.remedy !== all[0]?.remedy &&
      (status === 'PENDING' || status === 'DELIVERED')
        ? `If it is not met: ${condition.remedy}`
        : undefined,
    deliveredByDeveloper: false,
  };
};

const BREADCRUMBS: Record<WorkspaceViewerRole, { label: string; href: string } | null> = {
  BUYER: { label: 'Transactions', href: ROUTES.BUYER_TRANSACTIONS },
  REPRESENTATIVE: { label: 'Buyers I represent', href: PURCHASE_ROUTES.REPRESENTING },
  SELLER: null,
};

const SECTION_ID: Record<WorkspaceSection, string> = {
  approvals: 'workspace-approvals',
  deposit: 'workspace-deposit',
  steps: 'workspace-steps',
};

const CTA_LABEL: Record<WorkspaceSection, string> = {
  approvals: 'Give your approval',
  deposit: 'Review the deposit',
  steps: 'Review the steps',
};

const SectionCard = ({
  id,
  title,
  description,
  action,
  children,
}: {
  id?: string;
  title: string;
  description?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}) => (
  <section id={id} aria-label={title} className="scroll-mt-24">
    <Card>
      <CardHeader action={action}>
        <CardTitle as="h2">{title}</CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  </section>
);

/** A compact row for the summary rail: a name, a line under it and a badge on the right. */
const RailList = ({
  items,
}: {
  items: {
    id: string;
    title: string;
    detail?: string;
    badge?: React.ReactNode;
    /** Makes the name a link, e.g. to the case it summarises. */
    href?: string;
  }[];
}) => (
  <ul className="divide-y divide-border">
    {items.map((item) => (
      <li
        key={item.id}
        className="flex items-start justify-between gap-3 py-3 first:pt-0 last:pb-0"
      >
        <div className="min-w-0">
          {item.href ? (
            <Link
              href={item.href}
              className="block truncate text-sm font-medium text-primary hover:underline"
            >
              {item.title}
            </Link>
          ) : (
            <p className="truncate text-sm font-medium text-foreground">{item.title}</p>
          )}
          {item.detail && <p className="text-xs text-muted-foreground">{item.detail}</p>}
        </div>
        {item.badge && <div className="shrink-0">{item.badge}</div>}
      </li>
    ))}
  </ul>
);

/** The representative who gives the second approval, by name where the workspace knows it. */
const approvingRepresentativeName = (data: TransactionWorkspace): string | undefined =>
  data.coApproval.representative?.name ??
  data.representatives.find((r) => r.approvesPayments)?.name;

/**
 * One purchase as its buyer, its seller or the buyer's representative sees it (DIA-15): three
 * separate statuses, the next action, the steps, the legal transfer, approvals, people, documents
 * and history. Sureground holds only the deposit under Payment Protection, never the rest of the
 * price (D11), so nothing here says the price is held.
 */
export const TransactionWorkspaceView = ({
  role,
  txId,
}: {
  role: WorkspaceViewerRole;
  txId: string;
}) => {
  const queryClient = useQueryClient();
  const toast = useToast();
  const [pendingKey, setPendingKey] = useState<string | null>(null);
  const [releasing, setReleasing] = useState(false);
  const [refunding, setRefunding] = useState(false);
  const [releaseNotice, setReleaseNotice] = useState<string | null>(null);
  const [viewerTimeZone] = useState(() => browserTimeZone());
  const [disputingDeposit, setDisputingDeposit] = useState(false);
  const [reportingLand, setReportingLand] = useState(false);
  const key = transactionWorkspaceKeys.detail(role, txId);

  const workspace = useQuery({
    queryKey: key,
    queryFn: () => unwrap(transactionWorkspaceService.get(role, txId)),
    enabled: Boolean(txId),
  });
  const data = workspace.data;
  const disputes = usePurchaseDisputes(data);

  const refresh = () => {
    void queryClient.invalidateQueries({ queryKey: key });
    if (role === 'BUYER') void queryClient.invalidateQueries({ queryKey: buyerKeys.transactions });
  };
  const labelFor = (milestoneKey: string) =>
    data?.milestones.find((m) => m.key === milestoneKey)?.label ?? humaniseCode(milestoneKey);

  const confirm = useMutation({
    mutationFn: (milestoneKey: string) =>
      unwrap(
        transactionWorkspaceService.confirmMilestone(txId, milestoneKey, labelFor(milestoneKey))
      ),
    onMutate: (milestoneKey) => setPendingKey(milestoneKey),
    onSuccess: (updated) => {
      refresh();
      // Under two-person approval the step stays delivered until the representative approves too.
      toast.success(
        updated.status === 'DELIVERED'
          ? 'Your approval is recorded. Waiting for your representative.'
          : 'Step confirmed.'
      );
    },
    onError: (reason: Error) => toast.error(reason.message),
    onSettled: () => setPendingKey(null),
  });
  const dispute = useMutation({
    mutationFn: ({ milestoneKey, reason }: { milestoneKey: string; reason: string }) =>
      unwrap(transactionWorkspaceService.disputeMilestone(txId, milestoneKey, reason)),
    onMutate: ({ milestoneKey }) => setPendingKey(milestoneKey),
    onSuccess: () => {
      refresh();
      toast.success('Dispute sent to the seller.');
    },
    onError: (reason: Error) => toast.error(reason.message),
    onSettled: () => setPendingKey(null),
  });
  const disputeDeposit = useMutation({
    mutationFn: (input: { title: string; description: string }) =>
      unwrap(transactionWorkspaceService.disputeDeposit(txId, input)),
    onSuccess: () => {
      setDisputingDeposit(false);
      refresh();
      void queryClient.invalidateQueries({ queryKey: transactionWorkspaceKeys.saleDisputes });
      toast.success('Dispute raised. The deposit is on hold while Sureground reviews it.');
    },
    onError: (reason: Error) => toast.error(reason.message),
  });
  const settle = useMutation({
    mutationFn: ({ conditionKey, how }: { conditionKey: string; how: 'confirm' | 'waive' }) =>
      unwrap(landBuyerService.settleTransactionCondition(txId, conditionKey, how)),
    onMutate: ({ conditionKey }) => setPendingKey(conditionKey),
    onSuccess: (_next, { how }) => {
      refresh();
      toast.success(how === 'confirm' ? 'Condition confirmed.' : 'Condition waived.');
    },
    onError: (reason: Error) => toast.error(reason.message),
    onSettled: () => setPendingKey(null),
  });
  const release = useMutation({
    mutationFn: () =>
      withStepUpSummary(`Release the deposit for ${data?.propertyTitle ?? 'this purchase'}`, () =>
        unwrap(buyerService.releaseTransaction(txId))
      ),
    onSuccess: (result) => {
      setReleasing(false);
      const outcome = releaseOutcome(
        result.release,
        data ? approvingRepresentativeName(data) : undefined
      );
      // Waiting for the second approval: nothing moved, so the message stays on the page.
      setReleaseNotice(outcome.waiting ? outcome.message : null);
      refresh();
      toast.success(outcome.message);
    },
    onError: (reason: Error) => toast.error(reason.message),
  });

  // The route re-authenticates; the backend checks again that the handover has not started.
  const refund = useMutation({
    mutationFn: () =>
      withStepUpSummary(`Take back the deposit for ${data?.propertyTitle ?? 'this purchase'}`, () =>
        unwrap(buyerService.refundTransaction(txId))
      ),
    onSuccess: () => {
      setRefunding(false);
      refresh();
      toast.success('The purchase is cancelled and your deposit is being refunded.');
    },
    onError: (reason: Error) => toast.error(reason.message),
  });

  if (workspace.isLoading) return <StatGroupSkeleton groups={[3, 3]} />;
  if (workspace.isError || !data) {
    return (
      <PageErrorState
        title="This purchase is not available to you"
        description={workspace.error instanceof Error ? workspace.error.message : undefined}
        onRetry={() => void workspace.refetch()}
        isRetrying={workspace.isRefetching}
      />
    );
  }

  const isBuyer = data.viewer.role === 'BUYER';
  const isRepresentative = data.viewer.role === 'REPRESENTATIVE';
  const isSeller = data.viewer.role === 'SELLER';
  const isLandResale = data.plan === 'LAND_RESALE';
  const { moneyStatus, legalStatus } = data.statuses;
  const breadcrumb = BREADCRUMBS[data.viewer.role];
  const overdue = data.delays.overdueMilestones + data.delays.overdueLegalSteps;
  const progress = workspaceProgress(data);
  const target = nextActionTarget(data);
  const releasable = canReleaseDeposit(data);
  // The deposit waits for the handover (built home) or every required land step and condition.
  const releaseBlockedReason = releasable ? releaseBlockedNote(data) : null;
  const releaseBlocked = releaseBlockedReason !== null;
  const representativeName = approvingRepresentativeName(data);
  const releaseStage = depositReleaseStage(data);
  const releaseNote = isBuyer ? releaseStageNote(releaseStage, representativeName) : null;
  const hasDisputes =
    disputes.milestones.length + disputes.sale.length + disputes.land.length > 0 ||
    disputes.canDisputeDeposit ||
    disputes.canReportLand;

  return (
    <div className="space-y-6">
      {breadcrumb && (
        <Breadcrumbs className="mb-0" items={[breadcrumb, { label: data.propertyTitle }]} />
      )}

      {/* Header: the property, its three statuses and what happens next. */}
      <Card>
        <div className="flex flex-col gap-5 p-5 sm:flex-row sm:items-start sm:p-6">
          {/* The workspace carries no property image, so the tile shows the kind of property. */}
          <div
            className="flex h-16 w-16 shrink-0 items-center justify-center rounded-xl bg-accent text-primary"
            aria-hidden
          >
            <Building2 className="h-7 w-7" />
          </div>
          <div className="min-w-0 flex-1 space-y-3">
            <div>
              <p className="text-2xs font-semibold uppercase tracking-wide text-muted-foreground">
                {PLAN_LABEL[data.plan] ?? humaniseCode(data.plan)}
                {isRepresentative ? ' · You represent the buyer' : isSeller ? ' · Your sale' : ''}
              </p>
              <h1 className="mt-1 text-2xl font-semibold tracking-tight text-foreground">
                {data.propertyTitle}
              </h1>
            </div>
            <AcquisitionStatusBadges statuses={data.statuses} />
            {data.nextAction && (
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <p
                  className={
                    data.nextAction.waitingForYou
                      ? 'text-sm font-medium text-foreground'
                      : 'text-sm text-muted-foreground'
                  }
                >
                  <span className="text-muted-foreground">
                    {data.nextAction.waitingForYou ? 'Waiting for you: ' : 'Next: '}
                  </span>
                  {data.nextAction.label}
                </p>
                {target ? (
                  <Button
                    href={`#${SECTION_ID[target]}`}
                    icon={<ArrowRight className="h-4 w-4" aria-hidden />}
                  >
                    {CTA_LABEL[target]}
                  </Button>
                ) : (
                  <Button href={`#${SECTION_ID.steps}`} variant="secondary" size="sm">
                    See the steps
                  </Button>
                )}
              </div>
            )}
          </div>
        </div>
        {/* Progress at a glance: steps and legal transfer as bars, the deposit as its own status. */}
        <div className="grid gap-5 border-t border-border bg-secondary/40 p-5 sm:grid-cols-3 sm:p-6">
          {progress.steps.total > 0 ? (
            <Progress
              label="Purchase steps"
              value={progress.steps.done}
              max={progress.steps.total}
              showValue="fraction"
              tone={progress.steps.done === progress.steps.total ? 'success' : 'primary'}
            />
          ) : (
            <div>
              <p className="text-sm font-medium text-foreground">Purchase steps</p>
              <p className="text-xs text-muted-foreground">Not set up yet</p>
            </div>
          )}
          {progress.legal.total > 0 ? (
            <Progress
              label="Legal transfer"
              value={progress.legal.done}
              max={progress.legal.total}
              showValue="fraction"
              tone={legalStatus.code === 'PERFECTED' ? 'success' : 'primary'}
            />
          ) : (
            <div>
              <p className="text-sm font-medium text-foreground">Legal transfer</p>
              <p className="text-xs text-muted-foreground">{legalStatus.label}</p>
            </div>
          )}
          <div>
            <p className="text-sm font-medium text-foreground">Deposit</p>
            <p className="text-xs text-muted-foreground">{moneyStatus.note}</p>
          </div>
        </div>
      </Card>

      {releaseNotice && (
        <Alert
          variant="info"
          icon={Lock}
          title="Nothing has been released yet"
          onDismiss={() => setReleaseNotice(null)}
        >
          {releaseNotice}
        </Alert>
      )}

      {overdue > 0 && (
        <Alert variant={data.delays.escalated ? 'danger' : 'warning'} icon={Clock}>
          {[
            data.delays.overdueMilestones > 0
              ? `${data.delays.overdueMilestones} step${data.delays.overdueMilestones === 1 ? ' is' : 's are'} late`
              : null,
            data.delays.overdueLegalSteps > 0
              ? `${data.delays.overdueLegalSteps} legal step${data.delays.overdueLegalSteps === 1 ? ' is' : 's are'} late`
              : null,
          ]
            .filter(Boolean)
            .join(' and ')}
          .
          {data.delays.escalated
            ? ' A step is more than 30 days late and has been escalated to Sureground.'
            : ''}
        </Alert>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main column: what is happening. */}
        <div className="space-y-6 lg:col-span-2">
          <SectionCard
            id={SECTION_ID.steps}
            title="Purchase steps"
            description={
              !isBuyer
                ? 'The steps of this purchase and who has confirmed them.'
                : isLandResale
                  ? 'Confirm each step only when it has actually happened; dispute it if something is wrong.'
                  : 'Confirm each step only when it has actually happened; dispute it if something is wrong. These steps track the purchase: confirming one does not move any money.'
            }
          >
            <MilestoneTimeline
              milestones={data.milestones}
              contractOpen={isBuyer}
              requiredOnly
              pendingKey={pendingKey}
              ariaLabel="Purchase steps"
              empty={{
                title: 'No steps yet',
                description: isSeller
                  ? 'The steps appear here once the sale is set up. You then mark each one done for the buyer to confirm.'
                  : 'The steps appear here once the sale is set up. The seller marks each one done, then you confirm it.',
              }}
              disputeDescription="Tell the seller what is wrong with this step. It stays open while it is disputed, and they will deliver it again."
              awaitingLabel={isBuyer ? undefined : 'Awaiting the buyer'}
              onConfirm={isBuyer ? (milestoneKey) => confirm.mutateAsync(milestoneKey) : undefined}
              onDispute={
                isBuyer
                  ? (milestoneKey, reason) => dispute.mutateAsync({ milestoneKey, reason })
                  : undefined
              }
            />
          </SectionCard>

          {data.conditions.length > 0 && (
            <SectionCard
              title="Conditions of the sale"
              description="What must be true before the sale can complete."
            >
              <ConditionsPanel
                conditions={data.conditions.map(toClosingCondition)}
                role="buyer"
                sellerLabel="Seller"
                busyKey={settle.isPending ? pendingKey : null}
                onConfirm={
                  isBuyer && isLandResale
                    ? (conditionKey) => settle.mutate({ conditionKey, how: 'confirm' })
                    : undefined
                }
                onWaive={
                  isBuyer && isLandResale
                    ? (conditionKey) => settle.mutate({ conditionKey, how: 'waive' })
                    : undefined
                }
              />
            </SectionCard>
          )}

          <SectionCard
            title="Legal transfer"
            description="Consent and registration with the state, step by step, with who is responsible for each."
          >
            {data.legalCase ? (
              <PerfectionPanel
                perfection={{ ...data.legalCase, steps: data.legalSteps }}
                role="buyer"
              />
            ) : (
              <EmptyState
                icon={ListChecks}
                title="Not started yet"
                description="Sureground opens the legal transfer for this purchase. Its steps then appear here with who is responsible and when each is due."
                size="compact"
                bare
              />
            )}
          </SectionCard>

          <SectionCard
            title="History"
            description="Everything recorded on this purchase. Times show Lagos time next to yours."
          >
            {data.history.length === 0 ? (
              <EmptyState
                icon={Clock}
                title="Nothing recorded yet"
                description="Each step, approval and payment on this purchase is recorded here as it happens."
                size="compact"
                bare
              />
            ) : (
              <ActivityFeed
                items={purchaseHistoryItems(data.history, data.representatives)}
                viewerTimeZone={viewerTimeZone}
                headingLevel="h3"
              />
            )}
          </SectionCard>
        </div>

        {/* Summary rail: money, approvals, people and documents. */}
        <aside className="space-y-6" aria-label="Summary">
          <SectionCard
            id={SECTION_ID.deposit}
            title="Deposit"
            description="Payment Protection covers the deposit only. The rest of the price is paid outside Sureground."
          >
            <div className="space-y-3">
              <Badge dot variant={moneyVariant(moneyStatus.code)}>
                {moneyStatus.label}
              </Badge>
              {releaseBlocked ? (
                <>
                  <p id="deposit-release-blocked" className="text-sm text-muted-foreground">
                    {releaseBlockedReason}
                  </p>
                  <Button
                    className="w-full"
                    icon={<ShieldCheck className="h-4 w-4" aria-hidden />}
                    disabled
                    aria-describedby="deposit-release-blocked"
                  >
                    Release the deposit
                  </Button>
                </>
              ) : releasable ? (
                <>
                  {releaseStage === 'BOTH_APPROVED' ? (
                    <p className="text-sm font-medium text-foreground" role="status">
                      {releaseNote}
                    </p>
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      Release it only once you have received the property and the documents you
                      agreed.
                      {releaseNote ? ` ${releaseNote}` : ''}
                    </p>
                  )}
                  <Button
                    className="w-full"
                    icon={<ShieldCheck className="h-4 w-4" aria-hidden />}
                    onClick={() => setReleasing(true)}
                  >
                    Release the deposit
                  </Button>
                  {data.deposit?.refundable && (
                    <Button variant="outline" className="w-full" onClick={() => setRefunding(true)}>
                      Take my deposit back
                    </Button>
                  )}
                </>
              ) : isBuyer && releaseStage === 'WAITING_FOR_REPRESENTATIVE' ? (
                <p className="text-sm text-muted-foreground" role="status">
                  {releaseNote}
                </p>
              ) : (
                isSeller && (
                  <p className="text-sm text-muted-foreground">
                    {data.coApproval.binding
                      ? 'Two-person approval is on: the buyer’s representative approves the release too.'
                      : 'The buyer releases the deposit once they confirm the handover.'}
                  </p>
                )
              )}
            </div>
          </SectionCard>

          {hasDisputes && (
            <SectionCard
              title="Disputes"
              description="A deposit dispute keeps the deposit held until Sureground decides it."
            >
              <div className="space-y-4">
                {disputes.milestones.length + disputes.sale.length + disputes.land.length > 0 ? (
                  <RailList
                    items={[
                      ...disputes.sale.map((d) => ({
                        id: `sale-${d.id}`,
                        title: d.title,
                        // Its thread is in the buyer portal; the seller has no web workspace yet.
                        href: isBuyer ? PURCHASE_ROUTES.buyerDepositDispute(d.id) : undefined,
                        detail: d.respondBy
                          ? respondByText(d.respondBy, viewerTimeZone)
                          : `Deposit · opened ${formatDate(d.createdAt)} · Sureground decides`,
                        badge: (
                          <Badge variant={d.status === 'RESOLVED' ? 'neutral' : 'warning'}>
                            {SALE_DISPUTE_STATUS[d.status] ?? humaniseCode(d.status)}
                          </Badge>
                        ),
                      })),
                      ...disputes.land.map((d) => ({
                        id: `land-${d.id}`,
                        title: `Land case ${d.reference}`,
                        href: PURCHASE_ROUTES.landDispute(d.id),
                        detail:
                          d.canAppeal && d.appealDeadline
                            ? `Appeal by ${formatDate(d.appealDeadline)}, ${formatDualTime(d.appealDeadline, viewerTimeZone)}`
                            : d.respondBy
                              ? respondByText(d.respondBy, viewerTimeZone)
                              : `Opened ${formatDate(d.createdAt)}`,
                        badge: (
                          <Badge variant={d.canAppeal ? 'info' : 'neutral'}>
                            {d.canAppeal
                              ? 'Can appeal'
                              : (LAND_DISPUTE_STATUS[d.status] ?? humaniseCode(d.status))}
                          </Badge>
                        ),
                      })),
                      ...disputes.milestones.map((m) => ({
                        id: `step-${m.key}`,
                        title: m.label,
                        href: `#${SECTION_ID.steps}`,
                        detail: m.disputeReason ?? 'Step disputed',
                        badge: <Badge variant="warning">With the seller</Badge>,
                      })),
                    ]}
                  />
                ) : (
                  <p className="text-sm text-muted-foreground">
                    Nothing is in dispute on this purchase.
                  </p>
                )}
                {(disputes.canDisputeDeposit || disputes.canReportLand) && (
                  <div className="flex flex-col gap-2">
                    {disputes.canDisputeDeposit && (
                      <Button
                        variant="secondary"
                        size="sm"
                        className="w-full"
                        icon={<Scale className="h-4 w-4" aria-hidden />}
                        onClick={() => setDisputingDeposit(true)}
                      >
                        Dispute the deposit
                      </Button>
                    )}
                    {disputes.canReportLand && (
                      <Button
                        variant="secondary"
                        size="sm"
                        className="w-full"
                        onClick={() => setReportingLand(true)}
                      >
                        Report a problem with the land
                      </Button>
                    )}
                  </div>
                )}
              </div>
            </SectionCard>
          )}

          {(isBuyer || isRepresentative) && (
            <div id={SECTION_ID.approvals} className="scroll-mt-24">
              <CoApprovalCard
                deal={{ transactionId: data.transactionId }}
                viewer={isBuyer ? 'buyer' : 'representative'}
                moneyScope={isLandResale ? 'steps' : 'deposit'}
                labelFor={labelFor}
                onApproved={refresh}
                onChanged={(message, variant) => {
                  toast.show(message, variant);
                  if (variant === 'success') refresh();
                }}
              />
            </div>
          )}

          {!isSeller && (
            <SectionCard
              title={isRepresentative ? 'Your appointment' : 'Representatives'}
              action={
                isBuyer && data.representatives.length > 0 ? (
                  <Button href={PURCHASE_ROUTES.BUYER_REPRESENTATIVES} size="sm" variant="ghost">
                    Manage
                  </Button>
                ) : undefined
              }
            >
              {data.representatives.length > 0 ? (
                <RailList
                  items={data.representatives.map((r) => ({
                    id: r.appointmentId,
                    title: r.name ?? 'Invitation sent',
                    detail: [
                      REPRESENTATIVE_RELATIONSHIP_LABELS[
                        r.relationship as RepresentativeRelationship
                      ] ?? humaniseCode(r.relationship),
                      r.scopes
                        .map(
                          (scope) =>
                            REPRESENTATIVE_SCOPE_SHORT_LABELS[scope as RepresentativeScope] ??
                            humaniseCode(scope)
                        )
                        .join(', '),
                    ].join(' · '),
                    badge: r.approvesPayments ? (
                      <Badge variant="info">Approves</Badge>
                    ) : (
                      <Badge variant={r.status === 'ACTIVE' ? 'success' : 'warning'}>
                        {r.status === 'ACTIVE' ? 'Active' : 'Invited'}
                      </Badge>
                    ),
                  }))}
                />
              ) : (
                <EmptyState
                  icon={UsersRound}
                  title="No one appointed"
                  description="Buying from abroad? Someone you trust in Nigeria can follow this purchase, attend visits and approve the release with you."
                  action={
                    isBuyer ? (
                      <Button href={PURCHASE_ROUTES.BUYER_REPRESENTATIVES} size="sm">
                        Appoint a representative
                      </Button>
                    ) : undefined
                  }
                  size="compact"
                  bare
                />
              )}
            </SectionCard>
          )}

          <SectionCard title="Professionals">
            {data.professionals.length > 0 ? (
              <RailList
                items={data.professionals.map((p, index) => ({
                  id: `${p.role}-${index}`,
                  title: p.name,
                  detail: PROFESSIONAL_LABEL[p.role] ?? humaniseCode(p.role),
                  badge:
                    p.status === 'COMPLETED' ? (
                      <Badge variant="success">
                        {p.completedAt ? `Done ${formatDate(p.completedAt)}` : 'Done'}
                      </Badge>
                    ) : (
                      <Badge variant="info">Checking</Badge>
                    ),
                }))}
              />
            ) : (
              <EmptyState
                icon={ShieldCheck}
                title="No professionals assigned"
                description="The accredited surveyor, lawyer or inspector checking this property is named here once assigned."
                action={
                  isBuyer ? (
                    <Button
                      href={ROUTES.BUYER_MESSAGES}
                      size="sm"
                      variant="secondary"
                      icon={<MessageCircle className="h-4 w-4" aria-hidden />}
                    >
                      Ask Sureground
                    </Button>
                  ) : undefined
                }
                size="compact"
                bare
              />
            )}
          </SectionCard>

          <SectionCard title="Documents">
            {data.documents.length > 0 ? (
              <RailList
                items={data.documents.map((d) => ({
                  id: `${d.linkedTo}-${d.key}-${d.id}`,
                  title: humaniseCode(d.documentType),
                  detail: `${documentLinkLabel(d, data)} · added ${formatDate(d.uploadedAt)}`,
                }))}
              />
            ) : (
              <EmptyState
                icon={FileText}
                title="No documents yet"
                description="Evidence appears here as the seller delivers each step and the legal transfer moves on."
                size="compact"
                bare
              />
            )}
          </SectionCard>
        </aside>
      </div>

      {disputingDeposit && (
        <ReasonDialog
          open
          onOpenChange={(open) => !open && setDisputingDeposit(false)}
          title="Dispute the deposit"
          description="The deposit goes on hold straight away. Sureground reviews the dispute and decides whether the deposit is released or refunded."
          subject={{
            label: 'What is wrong?',
            placeholder: 'For example, what was agreed has not happened',
            minLength: 3,
            maxLength: 120,
          }}
          reasonLabel="Details"
          reasonPlaceholder="What happened and when, and what you agreed with the other side."
          rows={5}
          minLength={20}
          maxLength={2000}
          showCount
          confirmLabel="Raise the dispute"
          confirmIcon={<Scale className="h-4 w-4" aria-hidden />}
          loadingText="Raising…"
          onSubmit={({ subject = '', reason }) =>
            disputeDeposit.mutateAsync({ title: subject, description: reason })
          }
        />
      )}

      {disputes.canReportLand && (
        <ReportLandProblemDialog
          open={reportingLand}
          onClose={() => setReportingLand(false)}
          propertyId={data.propertyId}
          landTitle={data.propertyTitle}
        />
      )}

      <ConfirmDialog
        open={releasing}
        onOpenChange={(open) => !open && setReleasing(false)}
        title="Release the deposit to the seller?"
        description={releaseDialogDescription(releaseStage, representativeName)}
        confirmLabel={
          releaseStage === 'SINGLE' || releaseStage === 'BOTH_APPROVED'
            ? 'Release the deposit'
            : 'Record my approval'
        }
        isLoading={release.isPending}
        onConfirm={() => release.mutateAsync().catch(() => undefined)}
      />

      <ConfirmDialog
        open={refunding}
        onOpenChange={(open) => !open && setRefunding(false)}
        title="Take your deposit back?"
        description="This cancels the purchase and refunds the deposit Payment Protection holds. It cannot be undone. You can only do this before the seller starts the handover; after that, raise a dispute instead."
        confirmLabel="Take my deposit back"
        isLoading={refund.isPending}
        onConfirm={() => refund.mutateAsync().catch(() => undefined)}
      />
    </div>
  );
};
