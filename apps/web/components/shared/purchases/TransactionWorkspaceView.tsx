'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { withStepUpSummary } from '@sureground/shared';
import {
  ArrowRight,
  Building2,
  Clock,
  FileText,
  ListChecks,
  Lock,
  MessageCircle,
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
  StatGroupSkeleton,
  useToast,
} from '@sureground/ui';
import { AcquisitionStatusBadges } from './AcquisitionStatusBadges';
import { MilestoneTimeline } from '@/components/land/buyer/MilestoneTimeline';
import { ConditionsPanel } from '@/components/land/closing/ConditionsPanel';
import { PerfectionPanel } from '@/components/land/closing/PerfectionPanel';
import { ActivityFeed } from '@/components/shared/activity/ActivityFeed';
import { browserTimeZone } from '@/components/shared/forms/TimeZoneSelect';
import { CoApprovalCard } from '@/components/shared/representatives/CoApprovalCard';
import { unwrap } from '@/lib/apiHelpers';
import { ROUTES } from '@/lib/constants/auth';
import { PURCHASE_ROUTES } from '@/lib/constants/purchaseRoutes';
import { formatDate } from '@/lib/format';
import { buyerKeys, transactionWorkspaceKeys } from '@/lib/queryKeys';
import {
  canReleaseDeposit,
  documentLinkLabel,
  humaniseCode,
  moneyVariant,
  nextActionTarget,
  releaseOutcome,
  workspaceProgress,
  type WorkspaceSection,
} from '@/lib/transactionWorkspace';
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
  LAND_RESALE: 'Land resale',
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

/** The workspace's lean condition, in the shape the shared conditions panel reads. */
const toClosingCondition = (condition: WorkspaceCondition): LandClosingCondition => {
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
    note: condition.remedy ? `If it is not met: ${condition.remedy}` : undefined,
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
  items: { id: string; title: string; detail?: string; badge?: React.ReactNode }[];
}) => (
  <ul className="divide-y divide-border">
    {items.map((item) => (
      <li
        key={item.id}
        className="flex items-start justify-between gap-3 py-3 first:pt-0 last:pb-0"
      >
        <div className="min-w-0">
          <p className="truncate text-sm font-medium text-foreground">{item.title}</p>
          {item.detail && <p className="text-xs text-muted-foreground">{item.detail}</p>}
        </div>
        {item.badge && <div className="shrink-0">{item.badge}</div>}
      </li>
    ))}
  </ul>
);

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
  const [releaseNotice, setReleaseNotice] = useState<string | null>(null);
  const [viewerTimeZone] = useState(() => browserTimeZone());
  const key = transactionWorkspaceKeys.detail(role, txId);

  const workspace = useQuery({
    queryKey: key,
    queryFn: () => unwrap(transactionWorkspaceService.get(role, txId)),
    enabled: Boolean(txId),
  });
  const data = workspace.data;

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
      const outcome = releaseOutcome(result.release);
      // Waiting for the second approval: nothing moved, so the message stays on the page.
      setReleaseNotice(outcome.waiting ? outcome.message : null);
      refresh();
      toast.success(outcome.message);
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
                items={data.history}
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
              {releasable ? (
                <>
                  <p className="text-sm text-muted-foreground">
                    Release it only once you have received the property and the documents you
                    agreed.
                  </p>
                  <Button
                    className="w-full"
                    icon={<ShieldCheck className="h-4 w-4" aria-hidden />}
                    onClick={() => setReleasing(true)}
                  >
                    Release the deposit
                  </Button>
                </>
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

      <ConfirmDialog
        open={releasing}
        onOpenChange={(open) => !open && setReleasing(false)}
        title="Release the deposit to the seller?"
        description="Release only once you have received the property and the documents you agreed; it cannot be undone. If two-person approval is on, nothing moves until your representative approves too. This does not complete the legal transfer."
        confirmLabel="Release the deposit"
        isLoading={release.isPending}
        onConfirm={() => release.mutateAsync().catch(() => undefined)}
      />
    </div>
  );
};
