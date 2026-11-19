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
  Pagination,
  type ToastVariant,
} from '@sureground/ui';
import { ApiError, formatDate, formatRelativeTime, getInitials, unwrap } from '@sureground/shared';
import { adminService } from '@/services/adminService';
import { adminKeys } from '@/lib/queryKeys';
import { ADMIN_ROLE_DETAILS } from '@/lib/adminAccess';
import type { AdminStaffRole, StaffRoleGrantRequest } from '@/types/admin';

interface RoleGrantsPanelProps {
  currentUserId?: string;
  notify: (message: string, variant: ToastVariant) => void;
}

const PAGE_SIZE = 10;
const MIN_REASON_LENGTH = 10;

const roleLabel = (role: AdminStaffRole) => ADMIN_ROLE_DETAILS[role]?.label ?? role;
const roleList = (roles: AdminStaffRole[]) =>
  roles.length ? roles.map(roleLabel).join(', ') : 'no staff role';

export function roleGrantErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof ApiError) {
    if (error.code === 'ROLE_GRANT_SELF_APPROVAL') {
      return 'Another super admin has to decide this request: you asked for it, or it is for you.';
    }
    if (error.status === 409) {
      return `${error.message.replace(/\.$/, '')}. Refresh the list and check the request again.`;
    }
    if (error.status === 400) return `${error.message.replace(/\.$/, '')}.`;
  }
  return error instanceof Error && error.message ? error.message : fallback;
}

export const RoleGrantsPanel = ({ currentUserId, notify }: RoleGrantsPanelProps) => {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [approveTarget, setApproveTarget] = useState<StaffRoleGrantRequest | null>(null);
  const [rejectTarget, setRejectTarget] = useState<StaffRoleGrantRequest | null>(null);
  const [rejectReason, setRejectReason] = useState('');

  const { data, isLoading, isError, isFetching, refetch } = useQuery({
    queryKey: adminKeys.staffRoleGrantsList({ page, pageSize: PAGE_SIZE }),
    queryFn: () => unwrap(adminService.listRoleGrants({ page, pageSize: PAGE_SIZE })),
    placeholderData: keepPreviousData,
  });
  const requests = data?.items ?? [];
  const total = data?.total ?? 0;

  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: adminKeys.staffRoleGrants });
    queryClient.invalidateQueries({ queryKey: adminKeys.staff });
  };

  const approveMutation = useMutation({
    mutationFn: (id: string) => unwrap(adminService.approveRoleGrant(id)),
    onSuccess: (_, id) => {
      const request = requests.find((r) => r.id === id);
      refresh();
      setApproveTarget(null);
      notify(
        request
          ? `${request.targetUser.legalName} now has ${roleList(request.roles)}. They sign in again to use it.`
          : 'Role change approved.',
        'success'
      );
    },
    onError: (error) => {
      // A stale or already-decided request has left the queue on the server.
      if (error instanceof ApiError && (error.status === 409 || error.status === 400)) refresh();
      setApproveTarget(null);
      notify(roleGrantErrorMessage(error, 'We could not approve this role change.'), 'error');
    },
  });

  const rejectMutation = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string; withdrawing: boolean }) =>
      unwrap(adminService.rejectRoleGrant(id, reason)),
    onSuccess: (_data, { withdrawing }) => {
      refresh();
      setRejectTarget(null);
      setRejectReason('');
      notify(withdrawing ? 'Role change withdrawn.' : 'Role change rejected.', 'success');
    },
    onError: (error) => {
      if (error instanceof ApiError && (error.status === 409 || error.status === 400)) refresh();
      notify(roleGrantErrorMessage(error, 'We could not reject this role change.'), 'error');
    },
  });

  const busy = approveMutation.isPending || rejectMutation.isPending;

  const renderRequest = (request: StaffRoleGrantRequest) => {
    const askedByMe = request.requestedBy.id === currentUserId;
    const isForMe = request.targetUser.id === currentUserId;
    const ownRequest = askedByMe || isForMe;
    return (
      <li key={request.id} className="flex flex-col gap-3 p-4 sm:p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex min-w-0 items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-warning text-sm font-semibold text-white">
              {getInitials(request.targetUser.legalName)}
            </div>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <p className="font-medium text-foreground">{request.targetUser.legalName}</p>
                <Badge variant="warning">Awaiting second approval</Badge>
              </div>
              <p className="text-sm text-muted-foreground">
                {request.targetUser.email ?? 'No email address'}
              </p>
              <p className="mt-1.5 text-sm text-foreground">
                {roleList(request.previousRoles)} <span aria-hidden="true">→</span>{' '}
                <span className="font-medium">{roleList(request.roles)}</span>
              </p>
            </div>
          </div>

          <div className="shrink-0 text-xs text-muted-foreground sm:pt-1 sm:text-right">
            <p>
              Asked by{' '}
              <span className="font-medium text-foreground">
                {askedByMe ? 'you' : request.requestedBy.legalName}
              </span>{' '}
              • {formatRelativeTime(request.createdAt)}
            </p>
            <p>Expires {formatDate(request.expiresAt)}</p>
          </div>
        </div>

        {ownRequest && (
          <p className="text-xs text-muted-foreground">
            {isForMe
              ? 'This change is for you, so another super admin decides it.'
              : 'Another super admin has to approve your request. You can withdraw it.'}
          </p>
        )}

        <div className="flex flex-wrap gap-2 sm:justify-end">
          {!isForMe && (
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
              {askedByMe ? 'Withdraw' : 'Reject'}
            </Button>
          )}
          {!ownRequest && (
            <Button
              variant="primary"
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
      </li>
    );
  };

  return (
    <section className="overflow-hidden rounded-2xl border border-border bg-card">
      <div className="flex items-center justify-between border-b border-border p-5">
        <div>
          <h2 className="type-heading">Role changes awaiting approval</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Granting Super admin or Head of operations, or staff access to a non-staff account,
            needs a second super admin. Requests expire after 72 hours.
          </p>
        </div>
        {total > 0 && <Badge variant="warning">{total} pending</Badge>}
      </div>

      {isLoading ? (
        <ListSkeleton rows={2} label="Loading role changes" className="rounded-none border-0" />
      ) : isError && !data ? (
        <PageErrorState
          title="Role changes unavailable"
          description="Pending role changes could not be loaded. Nothing has been approved or rejected."
          onRetry={() => refetch()}
          isRetrying={isFetching}
          className="min-h-64 border-0"
        />
      ) : requests.length === 0 ? (
        <EmptyState
          icon={Inbox}
          title="No role changes waiting"
          description="Role changes that need a second super admin appear here."
          className="border-0 rounded-none shadow-none"
        />
      ) : (
        <ul className="divide-y divide-border">{requests.map(renderRequest)}</ul>
      )}

      {total > 0 && (
        <div className="border-t border-border px-5 py-4">
          <Pagination page={page} pageSize={PAGE_SIZE} total={total} onPageChange={setPage} />
        </div>
      )}

      <ConfirmDialog
        open={!!approveTarget}
        onOpenChange={(open) => !open && setApproveTarget(null)}
        title="Approve this role change?"
        description={
          approveTarget
            ? `${approveTarget.targetUser.legalName} will have ${roleList(approveTarget.roles)}, as ${approveTarget.requestedBy.legalName} asked. They are signed out and use the new role from their next sign-in.`
            : ''
        }
        confirmLabel="Approve role change"
        tone="primary"
        isLoading={approveMutation.isPending}
        onConfirm={() => approveTarget && approveMutation.mutate(approveTarget.id)}
      />

      <ConfirmDialog
        open={!!rejectTarget}
        onOpenChange={(open) => {
          if (open) return;
          setRejectTarget(null);
          setRejectReason('');
        }}
        title={
          rejectTarget?.requestedBy.id === currentUserId
            ? 'Withdraw this role change?'
            : 'Reject this role change?'
        }
        description={
          rejectTarget
            ? `${rejectTarget.targetUser.legalName} keeps ${roleList(rejectTarget.previousRoles)}. The reason is kept in the audit log.`
            : ''
        }
        confirmLabel={rejectTarget?.requestedBy.id === currentUserId ? 'Withdraw' : 'Reject'}
        promptLabel="Reason"
        promptPlaceholder="Why this change should not go ahead"
        promptValue={rejectReason}
        onPromptChange={setRejectReason}
        promptRequired
        promptMinLength={MIN_REASON_LENGTH}
        isLoading={rejectMutation.isPending}
        onConfirm={() =>
          rejectTarget &&
          rejectMutation.mutate({
            id: rejectTarget.id,
            reason: rejectReason.trim(),
            withdrawing: rejectTarget.requestedBy.id === currentUserId,
          })
        }
      />
    </section>
  );
};
