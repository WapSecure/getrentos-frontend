'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { withStepUpSummary } from '@sureground/shared';
import { AlertTriangle, Clock, FileText, Lock, ShieldCheck, UsersRound } from '@sureground/icons';
import {
  Alert,
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  ConfirmDialog,
  DataTable,
  DescriptionList,
  EmptyState,
  PageErrorState,
  PageHeader,
  StatGroupSkeleton,
  useToast,
  type Column,
  type DescriptionItem,
} from '@sureground/ui';
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
  legalVariant,
  moneyVariant,
  releaseOutcome,
  stageVariant,
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
  WorkspaceDocument,
  WorkspaceProfessional,
  WorkspaceRepresentative,
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

const SectionCard = ({
  title,
  description,
  action,
  children,
}: {
  title: string;
  description?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}) => (
  <Card>
    <CardHeader action={action}>
      <CardTitle as="h2">{title}</CardTitle>
      {description && <CardDescription>{description}</CardDescription>}
    </CardHeader>
    <CardContent>{children}</CardContent>
  </Card>
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
  const isLandResale = data.plan === 'LAND_RESALE';
  const { operationalStage, moneyStatus, legalStatus } = data.statuses;
  const breadcrumb = BREADCRUMBS[data.viewer.role];
  const overdue = data.delays.overdueMilestones + data.delays.overdueLegalSteps;

  const statusItems: DescriptionItem[] = [
    {
      label: 'Progress',
      value: (
        <Badge dot variant={stageVariant(operationalStage.code)}>
          {operationalStage.label}
        </Badge>
      ),
    },
    {
      label: 'Deposit',
      value: (
        <Badge dot variant={moneyVariant(moneyStatus.code)}>
          {moneyStatus.label}
        </Badge>
      ),
      hint: moneyStatus.note,
    },
    {
      label: 'Legal transfer',
      value: (
        <Badge dot variant={legalVariant(legalStatus.code)}>
          {legalStatus.label}
        </Badge>
      ),
    },
  ];
  if (data.viewer.role === 'SELLER') {
    statusItems.push({
      label: 'Two-person approval',
      value: data.coApproval.binding ? 'On: the buyer’s representative approves too' : 'Off',
    });
  }

  const representativeColumns: Column<WorkspaceRepresentative>[] = [
    {
      key: 'name',
      header: 'Name',
      render: (r) => <span className="font-medium text-foreground">{r.name ?? 'Invited'}</span>,
    },
    {
      key: 'relationship',
      header: 'Relationship',
      render: (r) =>
        REPRESENTATIVE_RELATIONSHIP_LABELS[r.relationship as RepresentativeRelationship] ??
        humaniseCode(r.relationship),
    },
    {
      key: 'scopes',
      header: 'May',
      render: (r) =>
        r.scopes
          .map(
            (scope) =>
              REPRESENTATIVE_SCOPE_SHORT_LABELS[scope as RepresentativeScope] ?? humaniseCode(scope)
          )
          .join(', '),
    },
    {
      key: 'status',
      header: 'Status',
      render: (r) => (
        <span className="flex flex-wrap gap-1.5">
          <Badge variant={r.status === 'ACTIVE' ? 'success' : 'warning'}>
            {r.status === 'ACTIVE' ? 'Active' : 'Invited'}
          </Badge>
          {r.approvesPayments && <Badge variant="info">Approves the release</Badge>}
        </span>
      ),
    },
  ];
  const professionalColumns: Column<WorkspaceProfessional>[] = [
    {
      key: 'role',
      header: 'Role',
      render: (p) => PROFESSIONAL_LABEL[p.role] ?? humaniseCode(p.role),
    },
    {
      key: 'name',
      header: 'Name',
      render: (p) => <span className="font-medium text-foreground">{p.name}</span>,
    },
    {
      key: 'status',
      header: 'Status',
      render: (p) =>
        p.status === 'COMPLETED' ? (
          <Badge variant="success">
            {p.completedAt ? `Finished ${formatDate(p.completedAt)}` : 'Finished'}
          </Badge>
        ) : (
          <Badge variant="info">Working on it</Badge>
        ),
    },
  ];
  const documentColumns: Column<WorkspaceDocument>[] = [
    {
      key: 'type',
      header: 'Document',
      render: (d) => (
        <span className="font-medium text-foreground">{humaniseCode(d.documentType)}</span>
      ),
    },
    { key: 'for', header: 'For', render: (d) => documentLinkLabel(d, data) },
    { key: 'uploaded', header: 'Added', render: (d) => formatDate(d.uploadedAt) },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        breadcrumbs={breadcrumb ? [breadcrumb, { label: data.propertyTitle }] : undefined}
        eyebrow={PLAN_LABEL[data.plan] ?? humaniseCode(data.plan)}
        title={data.propertyTitle}
        description={
          isRepresentative
            ? 'You are seeing this purchase for the buyer who appointed you.'
            : 'Each status below is tracked separately: a released deposit does not mean the property is legally yours.'
        }
      />

      {data.nextAction && (
        <Alert
          variant={data.nextAction.waitingForYou ? 'warning' : 'info'}
          icon={data.nextAction.waitingForYou ? AlertTriangle : Clock}
          title={data.nextAction.waitingForYou ? 'Waiting for you' : 'Next step'}
        >
          {data.nextAction.label}
        </Alert>
      )}

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

      <SectionCard title="Where things stand">
        <DescriptionList items={statusItems} columns={3} />
      </SectionCard>

      {canReleaseDeposit(data) && (
        <SectionCard
          title="Your deposit"
          description="Sureground holds your deposit under Payment Protection. The rest of the price is paid outside Sureground, so it is not held here."
          action={
            <Button
              size="sm"
              icon={<ShieldCheck className="h-4 w-4" aria-hidden />}
              onClick={() => setReleasing(true)}
            >
              Release the deposit
            </Button>
          }
        >
          <p className="text-sm text-muted-foreground">
            Release it only once you have received the property and the documents you agreed. If
            two-person approval is on, your representative must approve too before anything moves.
          </p>
        </SectionCard>
      )}

      <SectionCard
        title="Steps"
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
            description:
              'The steps of this purchase, and their progress, will appear here once set up.',
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

      {(isBuyer || isRepresentative) && (
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
      )}

      {data.conditions.length > 0 && (
        <SectionCard title="Conditions of the sale">
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
        description="Consent and registration with the state, tracked step by step with who is responsible."
      >
        {data.legalCase ? (
          <PerfectionPanel
            perfection={{ ...data.legalCase, steps: data.legalSteps }}
            role="buyer"
          />
        ) : (
          <EmptyState
            icon={FileText}
            title="Not started yet"
            description="The legal transfer steps appear here once Sureground opens them for this purchase."
            size="compact"
            bare
          />
        )}
      </SectionCard>

      {data.viewer.role !== 'SELLER' && (
        <SectionCard
          title="Representatives"
          description={
            isRepresentative
              ? 'Your appointment for this buyer.'
              : 'People you trust in Nigeria who can follow this purchase for you.'
          }
          action={
            isBuyer ? (
              <Button href={PURCHASE_ROUTES.BUYER_REPRESENTATIVES} size="sm" variant="secondary">
                Manage
              </Button>
            ) : undefined
          }
        >
          <DataTable
            variant="bare"
            caption="Representatives"
            columns={representativeColumns}
            data={data.representatives}
            getRowKey={(r) => r.appointmentId}
            emptyState={
              <EmptyState
                icon={UsersRound}
                title="No representatives"
                description="Appoint someone you trust to follow your purchases, attend visits and approve the release with you."
                size="compact"
                bare
              />
            }
          />
        </SectionCard>
      )}

      <SectionCard
        title="Professionals"
        description="The accredited professionals checking this property, named so you know who is accountable."
      >
        <DataTable
          variant="bare"
          caption="Professionals"
          columns={professionalColumns}
          data={data.professionals}
          getRowKey={(p, index) => `${p.role}-${index}`}
          emptyState={
            <EmptyState
              icon={ShieldCheck}
              title="No professionals yet"
              description="Professionals appear here once they are assigned to check this property."
              size="compact"
              bare
            />
          }
        />
      </SectionCard>

      <SectionCard
        title="Documents"
        description="Evidence attached to the steps, conditions and legal steps."
      >
        <DataTable
          variant="bare"
          caption="Documents"
          columns={documentColumns}
          data={data.documents}
          getRowKey={(d) => `${d.linkedTo}-${d.key}-${d.id}`}
          emptyState={
            <EmptyState
              icon={FileText}
              title="No documents yet"
              description="Documents added as evidence for a step appear here."
              size="compact"
              bare
            />
          }
        />
      </SectionCard>

      <SectionCard
        title="History"
        description="What has happened on this purchase. Times show Lagos time next to yours."
      >
        {data.history.length === 0 ? (
          <EmptyState
            icon={Clock}
            title="Nothing yet"
            description="Each change to this purchase is recorded here."
            size="compact"
            bare
          />
        ) : (
          <ActivityFeed items={data.history} viewerTimeZone={viewerTimeZone} headingLevel="h3" />
        )}
      </SectionCard>

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
