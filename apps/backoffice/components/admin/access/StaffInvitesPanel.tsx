'use client';

import { useState } from 'react';
import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Unlink, Mail } from '@sureground/icons';
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
import { formatDateTime, formatRelativeTime, unwrap } from '@sureground/shared';
import { adminService } from '@/services/adminService';
import { adminKeys } from '@/lib/queryKeys';
import type { StaffInviteLink } from '@/types/admin';

const PAGE_SIZE = 10;

export const StaffInvitesPanel = ({
  notify,
}: {
  notify: (message: string, variant: ToastVariant) => void;
}) => {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [revokeTarget, setRevokeTarget] = useState<StaffInviteLink | null>(null);
  const { data, isLoading, isError, isFetching, refetch } = useQuery({
    queryKey: adminKeys.staffInvitesList(page),
    queryFn: () => unwrap(adminService.listStaffInvites({ page, pageSize: PAGE_SIZE })),
    placeholderData: keepPreviousData,
  });

  const revoke = useMutation({
    mutationFn: (id: string) => unwrap(adminService.revokeStaffInvite(id)),
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: adminKeys.staffInvites });
      setRevokeTarget(null);
      notify(result.message, 'success');
    },
    onError: (error: Error) => {
      queryClient.invalidateQueries({ queryKey: adminKeys.staffInvites });
      setRevokeTarget(null);
      notify(error.message || 'The link could not be revoked.', 'error');
    },
  });

  const items = data?.items ?? [];
  const total = data?.total ?? 0;

  return (
    <section className="overflow-hidden rounded-2xl border border-border bg-card">
      <div className="flex items-center justify-between border-b border-border p-5">
        <div>
          <h2 className="type-heading">Open set-up and password links</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Links expire after 72 hours and work once. Revoke one that went to the wrong person.
          </p>
        </div>
        {total > 0 && <Badge variant="neutral">{total} open</Badge>}
      </div>
      {isLoading ? (
        <ListSkeleton rows={2} label="Loading links" className="rounded-none border-0" />
      ) : isError && !data ? (
        <PageErrorState
          title="Links unavailable"
          description="Open links could not be loaded."
          onRetry={() => refetch()}
          isRetrying={isFetching}
          className="min-h-48 border-0"
        />
      ) : items.length === 0 ? (
        <EmptyState
          icon={Mail}
          title="No open links"
          description="Set-up and password links that have not been used appear here."
          className="rounded-none border-0 shadow-none"
        />
      ) : (
        <ul className="divide-y divide-border">
          {items.map((invite) => (
            <li
              key={invite.id}
              className="flex flex-col gap-2 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5"
            >
              <div className="min-w-0">
                <p className="font-medium text-foreground">
                  {invite.staff?.legalName ?? 'Unknown staff member'}
                  <Badge variant="neutral" className="ml-2">
                    {invite.purpose === 'RESET' ? 'Password reset' : 'Account set-up'}
                  </Badge>
                </p>
                <p className="text-sm text-muted-foreground">{invite.staff?.email ?? 'No email'}</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Sent {formatRelativeTime(invite.createdAt)}
                  {invite.sentBy ? ` by ${invite.sentBy.legalName}` : ''} · expires{' '}
                  {formatDateTime(invite.expiresAt)}
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="gap-1.5 self-start sm:self-center"
                disabled={revoke.isPending}
                onClick={() => setRevokeTarget(invite)}
              >
                <Unlink className="h-3.5 w-3.5" />
                Revoke
              </Button>
            </li>
          ))}
        </ul>
      )}
      {total > PAGE_SIZE && (
        <div className="border-t border-border px-5 py-4">
          <Pagination page={page} pageSize={PAGE_SIZE} total={total} onPageChange={setPage} />
        </div>
      )}
      <ConfirmDialog
        open={!!revokeTarget}
        onOpenChange={(open) => !open && setRevokeTarget(null)}
        title="Revoke this link?"
        description={
          revokeTarget
            ? `The link sent to ${revokeTarget.staff?.legalName ?? 'this person'} stops working at once. You can send a new one later.`
            : ''
        }
        confirmLabel="Revoke link"
        isLoading={revoke.isPending}
        onConfirm={() => revokeTarget && revoke.mutate(revokeTarget.id)}
      />
    </section>
  );
};
