'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Check, Inbox, X } from 'lucide-react';
import { Button } from '@getrentos/ui';
import { Badge } from '@getrentos/ui';
import { Textarea } from '@getrentos/ui';
import { EmptyState } from '@getrentos/ui';
import { adminService } from '@/services/adminService';
import { unwrap } from '@getrentos/shared';
import { adminKeys } from '@/lib/queryKeys';
import { ADMIN_ROLE_DETAILS } from '@/lib/adminAccess';
import { formatRelativeTime, getInitials } from '@getrentos/shared';
import type { AdminStaffApproval } from '@/types/admin';
import type { ToastVariant } from '@getrentos/ui';

interface StaffApprovalsPanelProps {
  notify: (message: string, variant: ToastVariant) => void;
}

export const StaffApprovalsPanel = ({ notify }: StaffApprovalsPanelProps) => {
  const queryClient = useQueryClient();
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState('');

  const { data: approvals = [], isLoading } = useQuery({
    queryKey: adminKeys.staffApprovals,
    queryFn: () => unwrap(adminService.listApprovals()),
  });

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: adminKeys.staffApprovals });
    queryClient.invalidateQueries({ queryKey: adminKeys.staff });
  };

  const approveMutation = useMutation({
    mutationFn: (id: string) => unwrap(adminService.approveStaff(id)),
    onSuccess: () => {
      invalidate();
      notify('Staff member approved — they can now sign in.', 'success');
    },
    onError: (err) =>
      notify(err instanceof Error ? err.message : 'Failed to approve this request.', 'error'),
  });

  const rejectMutation = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) =>
      unwrap(adminService.rejectStaff(id, reason)),
    onSuccess: () => {
      invalidate();
      setRejectingId(null);
      setRejectReason('');
      notify('Staff creation rejected.', 'success');
    },
    onError: (err) =>
      notify(err instanceof Error ? err.message : 'Failed to reject this request.', 'error'),
  });

  const renderApproval = (approval: AdminStaffApproval) => {
    const isRejecting = rejectingId === approval.id;
    const busy = approveMutation.isPending || rejectMutation.isPending;

    return (
      <li key={approval.id} className="flex flex-col gap-3 p-4 sm:p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-r from-warning to-warning/60 text-white font-semibold text-sm">
              {getInitials(approval.staffUser.legalName)}
            </div>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <p className="font-medium text-foreground">{approval.staffUser.legalName}</p>
                <Badge variant="warning">Awaiting approval</Badge>
              </div>
              <p className="text-sm text-muted-foreground">
                {approval.staffUser.email ?? 'No email address'}
              </p>
              <div className="mt-1.5 flex flex-wrap gap-1.5">
                {approval.staffUser.roles.map(({ role }) => (
                  <Badge key={role} variant="neutral">
                    {ADMIN_ROLE_DETAILS[role]?.label ?? role}
                  </Badge>
                ))}
              </div>
            </div>
          </div>

          <p className="shrink-0 text-xs text-muted-foreground sm:pt-1">
            Requested by{' '}
            <span className="font-medium text-foreground">{approval.createdBy.legalName}</span> •{' '}
            {formatRelativeTime(approval.createdAt)}
          </p>
        </div>

        {isRejecting ? (
          <div className="space-y-2 rounded-xl border border-border bg-secondary/40 p-3">
            <Textarea
              aria-label="Rejection reason"
              placeholder="Reason for rejection (visible to the requesting admin)"
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              autoFocus
            />
            <div className="flex gap-2">
              <Button
                variant="ghost"
                size="sm"
                className="flex-1"
                onClick={() => {
                  setRejectingId(null);
                  setRejectReason('');
                }}
              >
                Cancel
              </Button>
              <Button
                variant="danger"
                size="sm"
                className="flex-1"
                disabled={!rejectReason.trim()}
                isLoading={rejectMutation.isPending}
                onClick={() =>
                  rejectMutation.mutate({ id: approval.id, reason: rejectReason.trim() })
                }
              >
                Confirm rejection
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex flex-wrap gap-2 sm:justify-end">
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5"
              disabled={busy}
              onClick={() => {
                setRejectingId(approval.id);
                setRejectReason('');
              }}
            >
              <X className="h-3.5 w-3.5" />
              Reject
            </Button>
            <Button
              variant="primary"
              size="sm"
              className="gap-1.5"
              disabled={busy}
              isLoading={approveMutation.isPending}
              onClick={() => approveMutation.mutate(approval.id)}
            >
              <Check className="h-3.5 w-3.5" />
              Approve
            </Button>
          </div>
        )}
      </li>
    );
  };

  return (
    <section className="overflow-hidden rounded-2xl border border-border bg-card">
      <div className="flex items-center justify-between border-b border-border p-5">
        <div>
          <h2 className="type-heading">Pending approvals</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Staff creations by junior admins wait here for a senior admin to approve.
          </p>
        </div>
        {approvals.length > 0 && <Badge variant="warning">{approvals.length} pending</Badge>}
      </div>

      {isLoading ? (
        <p className="p-5 text-sm text-muted-foreground">Loading approvals…</p>
      ) : approvals.length === 0 ? (
        <EmptyState
          icon={Inbox}
          title="No pending approvals"
          description="Staff creations you are eligible to approve will appear here."
          className="border-0 rounded-none shadow-none"
        />
      ) : (
        <ul className="divide-y divide-border">{approvals.map(renderApproval)}</ul>
      )}
    </section>
  );
};
