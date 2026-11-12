'use client';

import { useState } from 'react';
import { keepPreviousData, useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ShieldCheck, Check, X } from '@sureground/icons';
import {
  Badge,
  Button,
  Card,
  EmptyState,
  Input,
  ListSkeleton,
  Pagination,
  Tabs,
  TabsList,
  TabsTrigger,
  useToast,
  type BadgeVariant,
  PageHeader,
} from '@sureground/ui';
import {
  spendApprovalService,
  SPEND_APPROVAL_STATUS_LABELS,
  type SpendApproval,
  type SpendApprovalStatus,
} from '@/services/spendApprovalService';
import { SpendCapSettings } from './SpendCapSettings';
import { MandateCountersignSection } from '@/components/shared/authority/MandateCountersignSection';
import {
  needsExplicitAuthorisation,
  SPEND_BAND_LABELS,
  SPEND_BAND_VARIANT,
  withStepUpSummary,
} from '@sureground/shared';
import { unwrap } from '@/lib/apiHelpers';
import { formatCurrency, formatDate } from '@/lib/format';
import { investorKeys } from '@/lib/queryKeys';

const STATUS_VARIANT: Record<SpendApprovalStatus, BadgeVariant> = {
  PENDING: 'warning',
  APPROVED: 'success',
  REJECTED: 'neutral',
  CANCELLED: 'neutral',
};

const titleCase = (s: string) =>
  s
    .toLowerCase()
    .replace(/_/g, ' ')
    .replace(/^\w/, (c) => c.toUpperCase());
const PAGE_SIZE = 12;
const tabs: { value: 'owner' | 'requester'; label: string }[] = [
  { value: 'owner', label: 'To review' },
  { value: 'requester', label: 'My requests' },
];

interface ApprovalsViewProps {
  /**
   * Narrows the view to one property's requests waiting for the owner, without the page header,
   * limits and tabs: the Managed page shows it as one of its sections.
   */
  propertyId?: string;
}

export function ApprovalsView({ propertyId }: ApprovalsViewProps = {}) {
  const scoped = Boolean(propertyId);
  const queryClient = useQueryClient();
  const [chosenRole, setRole] = useState<'owner' | 'requester'>('owner');
  const role = scoped ? 'owner' : chosenRole;
  const [page, setPage] = useState(1);
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const toast = useToast();

  const { data, isLoading } = useQuery({
    queryKey: ['landlord', 'spend-approvals', role, propertyId ?? 'all', page],
    queryFn: () =>
      unwrap(
        spendApprovalService.list(
          scoped
            ? { role, status: 'PENDING', propertyId, page, pageSize: PAGE_SIZE }
            : { role, page, pageSize: PAGE_SIZE }
        )
      ),
    placeholderData: keepPreviousData,
  });
  const approvals = data?.items ?? [];
  const total = data?.total ?? 0;

  const invalidate = () =>
    Promise.all([
      queryClient.invalidateQueries({ queryKey: ['landlord', 'spend-approvals'] }),
      queryClient.invalidateQueries({ queryKey: investorKeys.managed }),
    ]);

  // Approval is behind step-up; an EXPLICIT request says so in the confirmation.
  const approveMutation = useMutation({
    mutationFn: (a: SpendApproval) =>
      withStepUpSummary(
        `${needsExplicitAuthorisation(a.band) ? 'Explicitly authorise' : 'Approve'} ${formatCurrency(a.amount)} for ${a.propertyTitle ?? 'this property'}`,
        () => unwrap(spendApprovalService.approve(a.id))
      ),
    onSuccess: () => {
      invalidate();
      toast.success('Approved. The expense has been recorded.');
    },
    onError: (e: Error) => toast.error(e.message || 'Could not approve.'),
  });

  const rejectMutation = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) =>
      unwrap(spendApprovalService.reject(id, reason)),
    onSuccess: () => {
      invalidate();
      setRejectingId(null);
      setRejectReason('');
      toast.success('Request declined.');
    },
    onError: (e: Error) => toast.error(e.message || 'Could not decline.'),
  });

  return (
    <>
      {!scoped && (
        <>
          <PageHeader
            title="Approvals"
            description="Spend your manager wants to make above your approval limit."
          />

          <MandateCountersignSection />

          <SpendCapSettings />
        </>
      )}

      {!scoped && (
        <Tabs
          value={role}
          onValueChange={(value) => {
            setRole(value as 'owner' | 'requester');
            setPage(1);
          }}
          className="mb-6"
        >
          <TabsList>
            {tabs.map((tab) => (
              <TabsTrigger key={tab.value} value={tab.value}>
                {tab.label}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      )}

      {isLoading ? (
        <ListSkeleton variant="cards" rows={3} />
      ) : approvals.length === 0 && scoped ? (
        <Card>
          <EmptyState
            size="compact"
            icon={ShieldCheck}
            title="Nothing waiting for you"
            description="Spend above your routine limit on this property will appear here."
          />
        </Card>
      ) : approvals.length === 0 ? (
        <Card className="p-12">
          <EmptyState
            icon={ShieldCheck}
            title={role === 'owner' ? 'Nothing to review' : 'No requests'}
            description={
              role === 'owner'
                ? 'Spend requests from your managers will appear here for you to approve.'
                : 'Spend you raise above the owner’s limit will appear here.'
            }
          />
        </Card>
      ) : (
        <div className="space-y-3">
          {approvals.map((a) => {
            const canDecide = role === 'owner' && a.status === 'PENDING';
            return (
              <Card key={a.id} className="p-5">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-semibold text-foreground">
                      {formatCurrency(a.amount)} · {titleCase(a.category)}
                    </p>
                    <p className="mt-0.5 text-sm text-muted-foreground">
                      {a.propertyTitle ?? 'Property'}
                      {role === 'owner' && a.requestedByName
                        ? ` · ${a.requestedByName}`
                        : ''} · {formatDate(a.createdAt)}
                    </p>
                  </div>
                  <div className="flex shrink-0 flex-wrap justify-end gap-1.5">
                    {a.band && (
                      <Badge variant={SPEND_BAND_VARIANT[a.band]}>
                        {SPEND_BAND_LABELS[a.band]}
                      </Badge>
                    )}
                    <Badge variant={STATUS_VARIANT[a.status]}>
                      {SPEND_APPROVAL_STATUS_LABELS[a.status]}
                    </Badge>
                  </div>
                </div>

                {a.note && <p className="mt-2 text-sm text-muted-foreground">{a.note}</p>}
                {a.status === 'REJECTED' && a.decisionNote && (
                  <p className="mt-1 text-sm text-muted-foreground">Declined: {a.decisionNote}</p>
                )}

                {canDecide &&
                  (rejectingId === a.id ? (
                    <div className="mt-3 space-y-2">
                      <Input
                        placeholder="Reason for declining"
                        aria-label="Reason for declining"
                        value={rejectReason}
                        onChange={(e) => setRejectReason(e.target.value)}
                      />
                      <div className="flex gap-2">
                        <Button
                          variant="danger"
                          size="sm"
                          disabled={!rejectReason.trim()}
                          isLoading={rejectMutation.isPending}
                          onClick={() =>
                            rejectMutation.mutate({ id: a.id, reason: rejectReason.trim() })
                          }
                        >
                          Confirm decline
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setRejectingId(null);
                            setRejectReason('');
                          }}
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="mt-3 flex gap-2">
                      <Button
                        variant="primary"
                        size="sm"
                        className="gap-1.5"
                        disabled={
                          approveMutation.isPending && approveMutation.variables?.id !== a.id
                        }
                        isLoading={
                          approveMutation.isPending && approveMutation.variables?.id === a.id
                        }
                        onClick={() => approveMutation.mutate(a)}
                      >
                        <Check className="h-4 w-4" />
                        {needsExplicitAuthorisation(a.band) ? 'Authorise' : 'Approve'}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="gap-1.5"
                        onClick={() => setRejectingId(a.id)}
                      >
                        <X className="h-4 w-4" />
                        Decline
                      </Button>
                    </div>
                  ))}
              </Card>
            );
          })}
        </div>
      )}

      {total > (scoped ? PAGE_SIZE : 0) && (
        <Pagination
          page={page}
          pageSize={PAGE_SIZE}
          total={total}
          onPageChange={setPage}
          className="mt-6"
        />
      )}
    </>
  );
}
