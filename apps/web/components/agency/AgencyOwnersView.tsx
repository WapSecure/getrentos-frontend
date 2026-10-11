'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  UserRound,
  Building2,
  AlertTriangle,
  Loader2,
  ArrowRight,
  Mail,
  UserPlus,
} from 'lucide-react';
import { Badge, Button, Toast, type BadgeVariant, type ToastVariant } from '@getrentos/ui';
import { useCustody } from './CustodyProvider';
import { InviteOwnerModal } from './InviteOwnerModal';
import { unwrap } from '@/lib/apiHelpers';
import {
  agencyOwnerInviteService,
  type AgencyOwnerInviteStatus,
} from '@/services/agencyOwnerInviteService';
import {
  isLive,
  MANDATE_STATUS_LABELS,
  type ManagementMandateDto,
  type MandateStatus,
} from '@/services/mandateService';

const STATUS_VARIANT: Partial<Record<MandateStatus, BadgeVariant>> = {
  ACTIVE: 'success',
  SUSPENDED: 'warning',
  PENDING_OWNER: 'info',
  PENDING_OPS: 'info',
  DRAFT: 'neutral',
  TERMINATED: 'neutral',
  EXPIRED: 'neutral',
  REJECTED: 'danger',
};

const INVITE_STATUS: Record<AgencyOwnerInviteStatus, { label: string; variant: BadgeVariant }> = {
  PENDING: { label: 'Invited', variant: 'info' },
  CLAIMED: { label: 'Joined', variant: 'success' },
  REVOKED: { label: 'Withdrawn', variant: 'neutral' },
  EXPIRED: { label: 'Expired', variant: 'warning' },
};

interface OwnerGroup {
  ownerId: string;
  ownerName: string;
  mandates: ManagementMandateDto[];
  liveCount: number;
}

/**
 * The firm's whole book, grouped by the client it belongs to, plus owners the
 * firm has invited but who aren't yet under a mandate.
 *
 * The custody bar answers "who am I acting for right now?" for a single property;
 * this answers "who are all my clients, and what do I run for each?". Choosing a
 * property here sets custody and drops into that client's workspace, so the
 * one-client discipline still holds once you are working.
 */
export function AgencyOwnersView() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { mandates, loading, error, select } = useCustody();
  const [inviteOpen, setInviteOpen] = useState(false);
  const [toast, setToast] = useState<{ message: string; variant: ToastVariant } | null>(null);

  const invitesQuery = useQuery({
    queryKey: ['agency', 'ownerInvites'],
    queryFn: () => unwrap(agencyOwnerInviteService.list()),
  });

  const inviteMutation = useMutation({
    mutationFn: (input: { email: string; name?: string; note?: string }) =>
      unwrap(agencyOwnerInviteService.invite(input)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['agency', 'ownerInvites'] });
      setInviteOpen(false);
      setToast({ message: 'Invitation sent.', variant: 'success' });
    },
    onError: (e: Error) =>
      setToast({ message: e.message || 'Could not send the invite.', variant: 'error' }),
  });

  const revokeMutation = useMutation({
    mutationFn: (id: string) => unwrap(agencyOwnerInviteService.revoke(id)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['agency', 'ownerInvites'] });
      setToast({ message: 'Invitation withdrawn.', variant: 'success' });
    },
    onError: (e: Error) =>
      setToast({ message: e.message || 'Could not withdraw.', variant: 'error' }),
  });

  const groups = useMemo<OwnerGroup[]>(() => {
    const byOwner = new Map<string, OwnerGroup>();
    for (const mandate of mandates) {
      const group = byOwner.get(mandate.ownerId) ?? {
        ownerId: mandate.ownerId,
        ownerName: mandate.ownerName ?? 'Owner',
        mandates: [],
        liveCount: 0,
      };
      group.mandates.push(mandate);
      if (isLive(mandate)) group.liveCount += 1;
      byOwner.set(mandate.ownerId, group);
    }
    return [...byOwner.values()].sort((a, b) => a.ownerName.localeCompare(b.ownerName));
  }, [mandates]);

  const openProperty = (mandate: ManagementMandateDto) => {
    select(mandate.id);
    router.push('/agency');
  };

  const invites = invitesQuery.data ?? [];
  // Outstanding (not yet a mandate) invites are the actionable ones to surface.
  const outstandingInvites = invites.filter(
    (i) => i.status === 'PENDING' || i.status === 'EXPIRED'
  );

  if (loading) {
    return (
      <div className="flex items-center gap-2 p-8 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
        Loading your clients…
      </div>
    );
  }

  if (error) {
    return (
      <div className="m-6 flex items-center gap-2 rounded-xl border border-border bg-amber-50 p-4 text-sm text-amber-800 dark:bg-amber-900/20 dark:text-amber-300">
        <AlertTriangle className="h-4 w-4 shrink-0" aria-hidden />
        We could not load your clients ({error}).
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6 flex items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Clients</h1>
          <p className="mt-1 text-muted-foreground">
            {groups.length === 0
              ? 'The owners whose properties you manage will appear here.'
              : `${groups.length} owner${groups.length === 1 ? '' : 's'} across ${mandates.length} propert${mandates.length === 1 ? 'y' : 'ies'}.`}
          </p>
        </div>
        <Button onClick={() => setInviteOpen(true)}>
          <UserPlus className="h-4 w-4" />
          Invite owner
        </Button>
      </div>

      {groups.length === 0 ? (
        <div className="rounded-2xl border border-border bg-card p-12 text-center">
          <UserRound className="mx-auto mb-3 h-10 w-10 text-muted-foreground/50" />
          <p className="text-muted-foreground">No client engagements yet.</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Invite an owner to bring their property under your management.
          </p>
        </div>
      ) : (
        <div className="grid gap-5 lg:grid-cols-2">
          {groups.map((group) => (
            <div key={group.ownerId} className="rounded-2xl border border-border bg-card p-5">
              <div className="mb-3 flex items-center justify-between gap-3">
                <Link
                  href={`/agency/owners/${group.ownerId}`}
                  className="flex min-w-0 items-center gap-2 hover:text-primary"
                >
                  <UserRound className="h-5 w-5 shrink-0 text-primary" aria-hidden />
                  <span className="truncate font-semibold text-foreground">{group.ownerName}</span>
                </Link>
                <span className="shrink-0 text-xs text-muted-foreground">
                  {group.mandates.length} propert{group.mandates.length === 1 ? 'y' : 'ies'}
                  {group.liveCount < group.mandates.length ? ` · ${group.liveCount} live` : ''}
                </span>
              </div>
              <div className="divide-y divide-border/60">
                {group.mandates.map((mandate) => (
                  <button
                    key={mandate.id}
                    type="button"
                    onClick={() => openProperty(mandate)}
                    className="flex w-full cursor-pointer items-center justify-between gap-3 py-2.5 text-left hover:text-primary"
                  >
                    <span className="flex min-w-0 items-center gap-2">
                      <Building2 className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
                      <span className="truncate text-sm text-foreground">
                        {mandate.propertyTitle ?? 'Property'}
                      </span>
                    </span>
                    <span className="flex shrink-0 items-center gap-2">
                      {!isLive(mandate) && (
                        <Badge variant={STATUS_VARIANT[mandate.status] ?? 'neutral'}>
                          {MANDATE_STATUS_LABELS[mandate.status]}
                        </Badge>
                      )}
                      <ArrowRight className="h-4 w-4 text-muted-foreground" aria-hidden />
                    </span>
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Invited owners not yet under a mandate */}
      {outstandingInvites.length > 0 && (
        <div className="mt-8">
          <h2 className="mb-2 text-sm font-semibold text-foreground">Invited owners</h2>
          <div className="overflow-hidden rounded-2xl border border-border bg-card">
            <table className="w-full text-sm">
              <tbody className="divide-y divide-border/60">
                {outstandingInvites.map((invite) => {
                  const pill = INVITE_STATUS[invite.status];
                  return (
                    <tr key={invite.id}>
                      <td className="px-4 py-3">
                        <span className="flex items-center gap-2">
                          <Mail className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
                          <span className="min-w-0">
                            <span className="block truncate text-foreground">
                              {invite.name ?? invite.email}
                            </span>
                            {invite.name && (
                              <span className="block truncate text-xs text-muted-foreground">
                                {invite.email}
                              </span>
                            )}
                          </span>
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant={pill.variant}>{pill.label}</Badge>
                        {invite.hasAccount && invite.status === 'PENDING' && (
                          <span className="ml-2 text-xs text-muted-foreground">has an account</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => revokeMutation.mutate(invite.id)}
                          disabled={revokeMutation.isPending}
                        >
                          Withdraw
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <InviteOwnerModal
        isOpen={inviteOpen}
        onClose={() => setInviteOpen(false)}
        onSubmit={(input) => inviteMutation.mutate(input)}
        isSubmitting={inviteMutation.isPending}
        error={inviteMutation.isError ? (inviteMutation.error as Error).message : null}
      />

      {toast && (
        <Toast message={toast.message} variant={toast.variant} onClose={() => setToast(null)} />
      )}
    </div>
  );
}
