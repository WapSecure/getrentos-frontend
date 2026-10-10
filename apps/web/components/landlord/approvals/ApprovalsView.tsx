'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ShieldCheck, Check, X } from 'lucide-react';
import {
  Badge,
  Button,
  EmptyState,
  Input,
  Pagination,
  PageLoadingState,
  Toast,
  type BadgeVariant,
  type ToastVariant,
} from '@getrentos/ui';
import {
  spendApprovalService,
  SPEND_APPROVAL_STATUS_LABELS,
  type SpendApprovalStatus,
} from '@/services/spendApprovalService';
import { unwrap } from '@/lib/apiHelpers';

const STATUS_VARIANT: Record<SpendApprovalStatus, BadgeVariant> = {
  PENDING: 'warning',
  APPROVED: 'success',
  REJECTED: 'neutral',
  CANCELLED: 'neutral',
};

const formatNaira = (amount: number) =>
  `₦${amount.toLocaleString('en-NG', { maximumFractionDigits: 0 })}`;
const titleCase = (s: string) =>
  s
    .toLowerCase()
    .replace(/_/g, ' ')
    .replace(/^\w/, (c) => c.toUpperCase());
const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric' });

const PAGE_SIZE = 12;
const tabs: { value: 'owner' | 'requester'; label: string }[] = [
  { value: 'owner', label: 'To review' },
  { value: 'requester', label: 'My requests' },
];

export function ApprovalsView() {
  const queryClient = useQueryClient();
  const [role, setRole] = useState<'owner' | 'requester'>('owner');
  const [page, setPage] = useState(1);
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [toast, setToast] = useState<{ message: string; variant: ToastVariant } | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['landlord', 'spend-approvals', role, page],
    queryFn: () => unwrap(spendApprovalService.list({ role, page, pageSize: PAGE_SIZE })),
  });
  const approvals = data?.items ?? [];
  const total = data?.total ?? 0;

  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: ['landlord', 'spend-approvals'] });

  const approveMutation = useMutation({
    mutationFn: (id: string) => unwrap(spendApprovalService.approve(id)),
    onSuccess: () => {
      invalidate();
      setToast({ message: 'Approved — the expense has been recorded.', variant: 'success' });
    },
    onError: (e: Error) =>
      setToast({ message: e.message || 'Could not approve.', variant: 'error' }),
  });

  const rejectMutation = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) =>
      unwrap(spendApprovalService.reject(id, reason)),
    onSuccess: () => {
      invalidate();
      setRejectingId(null);
      setRejectReason('');
      setToast({ message: 'Request declined.', variant: 'success' });
    },
    onError: (e: Error) =>
      setToast({ message: e.message || 'Could not decline.', variant: 'error' }),
  });

  return (
    <>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">Approvals</h1>
        <p className="mt-1 text-muted-foreground">
          Spend your manager wants to make above your approval limit.
        </p>
      </div>

      <div className="mb-6 flex w-fit gap-1 rounded-lg bg-secondary p-1">
        {tabs.map((tab) => (
          <button
            key={tab.value}
            onClick={() => {
              setRole(tab.value);
              setPage(1);
            }}
            className={`whitespace-nowrap rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
              role === tab.value
                ? 'bg-card text-primary shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {isLoading ? (
        <PageLoadingState />
      ) : approvals.length === 0 ? (
        <div className="rounded-2xl border border-border bg-card p-12">
          <EmptyState
            icon={ShieldCheck}
            title={role === 'owner' ? 'Nothing to review' : 'No requests'}
            description={
              role === 'owner'
                ? 'Spend requests from your managers will appear here for you to approve.'
                : 'Spend you raise above the owner’s limit will appear here.'
            }
          />
        </div>
      ) : (
        <div className="space-y-3">
          {approvals.map((a) => {
            const canDecide = role === 'owner' && a.status === 'PENDING';
            return (
              <div key={a.id} className="rounded-2xl border border-border bg-card p-5">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-semibold text-foreground">
                      {formatNaira(a.amount)} · {titleCase(a.category)}
                    </p>
                    <p className="mt-0.5 text-sm text-muted-foreground">
                      {a.propertyTitle ?? 'Property'}
                      {role === 'owner' && a.requestedByName
                        ? ` · ${a.requestedByName}`
                        : ''} · {formatDate(a.createdAt)}
                    </p>
                  </div>
                  <Badge variant={STATUS_VARIANT[a.status]}>
                    {SPEND_APPROVAL_STATUS_LABELS[a.status]}
                  </Badge>
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
                        value={rejectReason}
                        onChange={(e) => setRejectReason(e.target.value)}
                      />
                      <div className="flex gap-2">
                        <Button
                          variant="danger"
                          size="sm"
                          disabled={!rejectReason.trim() || rejectMutation.isPending}
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
                        disabled={approveMutation.isPending}
                        onClick={() => approveMutation.mutate(a.id)}
                      >
                        <Check className="h-4 w-4" />
                        Approve
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
              </div>
            );
          })}
        </div>
      )}

      {total > 0 && (
        <Pagination
          page={page}
          pageSize={PAGE_SIZE}
          total={total}
          onPageChange={setPage}
          className="mt-6"
        />
      )}

      {toast && (
        <Toast message={toast.message} variant={toast.variant} onClose={() => setToast(null)} />
      )}
    </>
  );
}
