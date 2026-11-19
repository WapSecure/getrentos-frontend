'use client';

import { useState } from 'react';
import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Check, Inbox, X } from '@sureground/icons';
import {
  Badge,
  Button,
  ConfirmDialog,
  EmptyState,
  ListSkeleton,
  PageErrorState,
  PageHeader,
  Pagination,
  Tabs,
  TabsList,
  TabsTrigger,
  useToast,
} from '@sureground/ui';
import { ApiError, formatDate, formatRelativeTime, unwrap } from '@sureground/shared';
import { adminService } from '@/services/adminService';
import { adminKeys } from '@/lib/queryKeys';
import { PERMISSION_LABELS } from '@/lib/adminAccess';
import type {
  AdminChangeRequest,
  AdminPermission,
  ApprovalStatus,
  ChangeRequestKind,
} from '@/types/admin';

const PAGE_SIZE = 10;
const MIN_REASON_LENGTH = 10;

const KIND_LABELS: Record<ChangeRequestKind, string> = {
  STAFF_ACCESS: 'Staff access',
  PLATFORM_CONFIG: 'Platform configuration',
  SHORTLET_FEES: 'Shortlet fees and tax',
  SALE_COMMISSION: 'Sale commission split',
};

const FIELD_LABELS: Record<string, string> = {
  minTrustScore: 'Minimum trust score for auto-approval',
  escrowHoldDays: 'Deposit verification hold (days)',
  autoFlagFraud: 'Auto-flag suspicious activity',
  roleRequirements: 'Roles needing manual verification',
  commissionPct: 'Commission (%)',
  introCommissionPct: 'Launch commission (%)',
  introEndsAt: 'Launch rate ends',
  taxName: 'Tax name',
  taxPct: 'Tax (%)',
  depositClaimWindowHours: 'Deposit claim window (hours)',
  listingSidePct: 'Listing side (%)',
  buyerSidePct: 'Buyer side (%)',
};

const show = (value: unknown): string => {
  if (value === null || value === undefined || value === '') return 'none';
  if (typeof value === 'boolean') return value ? 'on' : 'off';
  if (Array.isArray(value)) {
    const roles = value as { role?: string; requiresVerification?: boolean }[];
    if (roles.every((entry) => typeof entry === 'object' && entry && 'role' in entry)) {
      const required = roles.filter((entry) => entry.requiresVerification).map((e) => e.role);
      return required.length ? required.join(', ') : 'none';
    }
    return value.length ? value.join(', ') : 'none';
  }
  return String(value);
};

const permissionList = (values: unknown) =>
  ((values as AdminPermission[] | undefined) ?? [])
    .map((p) => PERMISSION_LABELS[p] ?? p)
    .join(', ');

function describeChange(request: AdminChangeRequest): string[] {
  const payload = request.payload ?? {};
  const baseline = request.baseline ?? {};
  if (request.kind === 'STAFF_ACCESS') {
    const lines: string[] = [];
    const granted = payload.grantedPermissions as AdminPermission[] | undefined;
    const revoked = payload.revokedPermissions as AdminPermission[] | undefined;
    if (granted?.length) lines.push(`Adds beyond their role: ${permissionList(granted)}`);
    if (revoked?.length) lines.push(`Removes from their role: ${permissionList(revoked)}`);
    const before = (baseline.regions as string[] | undefined) ?? [];
    const after = (payload.regions as string[] | undefined) ?? [];
    const label = (regions: string[]) => (regions.length ? regions.join(', ') : 'nationwide');
    if (label(before) !== label(after)) lines.push(`Regions: ${label(before)} → ${label(after)}`);
    return lines.length ? lines : ['Clears their personal adjustments'];
  }
  return Object.keys(payload)
    .filter((key) => JSON.stringify(payload[key]) !== JSON.stringify(baseline[key]))
    .map((key) => `${FIELD_LABELS[key] ?? key}: ${show(baseline[key])} → ${show(payload[key])}`);
}

function errorMessage(error: unknown, fallback: string): string {
  if (error instanceof ApiError && error.code === 'CHANGE_REQUEST_STALE') {
    return 'This changed after the request was made, so it no longer applies. Ask for it again.';
  }
  return error instanceof Error && error.message ? error.message : fallback;
}

export default function ChangeRequestsPage() {
  const queryClient = useQueryClient();
  const toast = useToast();
  const [status, setStatus] = useState<ApprovalStatus>('PENDING');
  const [page, setPage] = useState(1);
  const [approveTarget, setApproveTarget] = useState<AdminChangeRequest | null>(null);
  const [rejectTarget, setRejectTarget] = useState<AdminChangeRequest | null>(null);
  const [rejectReason, setRejectReason] = useState('');

  const { data, isLoading, isError, isFetching, refetch } = useQuery({
    queryKey: adminKeys.changeRequestsList({ status, page, pageSize: PAGE_SIZE }),
    queryFn: () => unwrap(adminService.listChangeRequests({ status, page, pageSize: PAGE_SIZE })),
    placeholderData: keepPreviousData,
  });
  const requests = data?.items ?? [];
  const total = data?.total ?? 0;

  const refresh = () => queryClient.invalidateQueries({ queryKey: adminKeys.changeRequests });

  const approve = useMutation({
    mutationFn: (id: string) => unwrap(adminService.approveChangeRequest(id)),
    onSuccess: (_, id) => {
      const request = requests.find((r) => r.id === id);
      refresh();
      queryClient.invalidateQueries({ queryKey: adminKeys.staff });
      setApproveTarget(null);
      toast.success(
        request?.kind === 'STAFF_ACCESS'
          ? `Approved. ${request.subjectName ?? 'They'} get the new access from their next sign-in.`
          : 'Approved. The change is now live.'
      );
    },
    onError: (error) => {
      if (error instanceof ApiError && (error.status === 409 || error.status === 400)) refresh();
      setApproveTarget(null);
      toast.error(errorMessage(error, 'We could not approve this change.'));
    },
  });

  const reject = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) =>
      unwrap(adminService.rejectChangeRequest(id, reason)),
    onSuccess: (result) => {
      refresh();
      setRejectTarget(null);
      setRejectReason('');
      toast.success(result.message);
    },
    onError: (error) => {
      if (error instanceof ApiError && (error.status === 409 || error.status === 400)) refresh();
      toast.error(errorMessage(error, 'We could not reject this change.'));
    },
  });

  const busy = approve.isPending || reject.isPending;

  const renderRequest = (request: AdminChangeRequest) => {
    const lines = describeChange(request);
    return (
      <li key={request.id} className="flex flex-col gap-3 p-4 sm:p-5">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <p className="font-medium text-foreground">
                {KIND_LABELS[request.kind]}
                {request.subjectName ? ` for ${request.subjectName}` : ''}
              </p>
              {request.status === 'PENDING' ? (
                <Badge variant="warning">Awaiting second approval</Badge>
              ) : request.status === 'APPROVED' ? (
                <Badge variant="success">Approved</Badge>
              ) : (
                <Badge variant="neutral">Not applied</Badge>
              )}
            </div>
            <ul className="mt-2 space-y-1 text-sm text-foreground">
              {lines.map((line) => (
                <li key={line}>{line}</li>
              ))}
            </ul>
            <p className="mt-2 text-sm text-muted-foreground">Reason: {request.reason}</p>
            {request.rejectionReason && (
              <p className="mt-1 text-sm text-muted-foreground">
                {request.decidedBy ? `${request.decidedBy.legalName}: ` : ''}
                {request.rejectionReason}
              </p>
            )}
          </div>
          <div className="shrink-0 text-xs text-muted-foreground sm:text-right">
            <p>
              Asked by{' '}
              <span className="font-medium text-foreground">
                {request.isMine ? 'you' : request.requestedBy.legalName}
              </span>{' '}
              • {formatRelativeTime(request.createdAt)}
            </p>
            {request.status === 'PENDING' ? (
              <p>Expires {formatDate(request.expiresAt)}</p>
            ) : (
              request.decidedAt && <p>Decided {formatRelativeTime(request.decidedAt)}</p>
            )}
          </div>
        </div>

        {request.status === 'PENDING' && (
          <div className="flex flex-wrap items-center gap-2 sm:justify-end">
            {request.isMine && (
              <p className="mr-auto text-xs text-muted-foreground">
                Another officer has to approve your request. You can withdraw it.
              </p>
            )}
            {(request.isMine || request.canDecide) && (
              <Button
                variant="outline"
                size="sm"
                className="gap-1.5"
                disabled={busy}
                onClick={() => {
                  setRejectTarget(request);
                  setRejectReason('');
                }}
              >
                <X className="h-3.5 w-3.5" />
                {request.isMine ? 'Withdraw' : 'Reject'}
              </Button>
            )}
            {request.canDecide && (
              <Button
                size="sm"
                className="gap-1.5"
                disabled={busy}
                onClick={() => setApproveTarget(request)}
              >
                <Check className="h-3.5 w-3.5" />
                Approve
              </Button>
            )}
          </div>
        )}
      </li>
    );
  };

  return (
    <>
      <PageHeader
        title="Approvals"
        description="Changes that need a second officer: wider staff access, and platform-wide settings such as fees, commission and trust thresholds. Nothing here takes effect until someone other than the requester approves it."
      />

      <Tabs
        value={status}
        onValueChange={(value) => {
          setStatus(value as ApprovalStatus);
          setPage(1);
        }}
        className="mb-5"
      >
        <TabsList aria-label="Request status">
          <TabsTrigger value="PENDING">Waiting</TabsTrigger>
          <TabsTrigger value="APPROVED">Approved</TabsTrigger>
          <TabsTrigger value="REJECTED">Rejected or withdrawn</TabsTrigger>
        </TabsList>
      </Tabs>

      <section className="overflow-hidden rounded-2xl border border-border bg-card">
        {isLoading ? (
          <ListSkeleton rows={3} label="Loading approvals" className="rounded-none border-0" />
        ) : isError && !data ? (
          <PageErrorState
            title="Approvals unavailable"
            description="Requests could not be loaded. Nothing has been approved or rejected."
            onRetry={() => refetch()}
            isRetrying={isFetching}
            className="min-h-64 border-0"
          />
        ) : requests.length === 0 ? (
          <EmptyState
            icon={Inbox}
            title={status === 'PENDING' ? 'Nothing waiting' : 'Nothing here yet'}
            description="Requests you can decide, and the ones you asked for, appear here."
            className="rounded-none border-0 shadow-none"
          />
        ) : (
          <ul className="divide-y divide-border">{requests.map(renderRequest)}</ul>
        )}

        {total > 0 && (
          <div className="border-t border-border px-5 py-4">
            <Pagination page={page} pageSize={PAGE_SIZE} total={total} onPageChange={setPage} />
          </div>
        )}
      </section>

      <ConfirmDialog
        open={!!approveTarget}
        onOpenChange={(open) => !open && setApproveTarget(null)}
        title="Approve this change?"
        description={
          approveTarget
            ? `${describeChange(approveTarget).join('. ')}. Asked for by ${approveTarget.requestedBy.legalName}. It takes effect as soon as you approve.`
            : ''
        }
        confirmLabel="Approve change"
        tone="primary"
        isLoading={approve.isPending}
        onConfirm={() => approveTarget && approve.mutate(approveTarget.id)}
      />

      <ConfirmDialog
        open={!!rejectTarget}
        onOpenChange={(open) => {
          if (open) return;
          setRejectTarget(null);
          setRejectReason('');
        }}
        title={rejectTarget?.isMine ? 'Withdraw this request?' : 'Reject this change?'}
        description="Nothing changes. The reason is kept in the audit log."
        confirmLabel={rejectTarget?.isMine ? 'Withdraw' : 'Reject'}
        promptLabel="Reason"
        promptPlaceholder="Why this should not go ahead"
        promptValue={rejectReason}
        onPromptChange={setRejectReason}
        promptRequired
        promptMinLength={MIN_REASON_LENGTH}
        isLoading={reject.isPending}
        onConfirm={() =>
          rejectTarget && reject.mutate({ id: rejectTarget.id, reason: rejectReason.trim() })
        }
      />
    </>
  );
}
