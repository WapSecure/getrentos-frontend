'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Building2, ShieldCheck, XCircle } from 'lucide-react';
import {
  Badge,
  Button,
  Card,
  EmptyState,
  NumberInput,
  PageErrorState,
  Select,
  Textarea,
  type BadgeVariant,
} from '@getrentos/ui';
import { formatDate, type ApiResponse } from '@getrentos/shared';
import {
  propertyAuthorityService,
  type AuthorityStatus,
  type PropertyAuthorityClaim,
} from '@/services/propertyAuthorityService';
import { adminKeys } from '@/lib/queryKeys';

type StatusFilter = 'PENDING' | 'ACTIVE' | 'REJECTED' | 'REVOKED' | 'EXPIRED' | 'all';

const STATUS_OPTIONS: { value: StatusFilter; label: string }[] = [
  { value: 'PENDING', label: 'Awaiting decision' },
  { value: 'ACTIVE', label: 'Active' },
  { value: 'REJECTED', label: 'Rejected' },
  { value: 'REVOKED', label: 'Revoked' },
  { value: 'EXPIRED', label: 'Expired' },
  { value: 'all', label: 'All' },
];

const STATUS_META: Record<AuthorityStatus, { label: string; variant: BadgeVariant }> = {
  PENDING: { label: 'Awaiting decision', variant: 'warning' },
  ACTIVE: { label: 'Active', variant: 'success' },
  REJECTED: { label: 'Rejected', variant: 'danger' },
  REVOKED: { label: 'Revoked', variant: 'danger' },
  EXPIRED: { label: 'Expired', variant: 'neutral' },
};

/** A mandate opens a property up, so "why" is recorded with every decision. */
const MIN_REASON_LENGTH = 10;

/**
 * Property authority claims — the officer's queue.
 *
 * Approving grants a mandate over someone else's property, which is why it
 * lives behind the same verification permissions as the rest of the trust
 * decisions, and why the three capabilities are offered separately: `canList`
 * lets them advertise the property, `canManage` additionally lets them run its
 * tenancy, and `canTransact` additionally lets them act on its money. Each is a
 * materially bigger decision than the last, so they are explicit choices rather
 * than implied ones.
 */
export default function PropertyAuthoritiesPage() {
  const queryClient = useQueryClient();
  const [status, setStatus] = useState<StatusFilter>('PENDING');
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [canManage, setCanManage] = useState(false);
  const [canTransact, setCanTransact] = useState(false);
  const [expiresInDays, setExpiresInDays] = useState<number | string>('');
  const [note, setNote] = useState('');
  const [reason, setReason] = useState('');
  const [openId, setOpenId] = useState<string | null>(null);

  const claimsQuery = useQuery({
    queryKey: adminKeys.authorityClaims({ status }),
    queryFn: () => propertyAuthorityService.list(status === 'all' ? {} : { status }),
    select: (response) => {
      if (!response.success) throw new Error(response.error ?? 'Could not load claims');
      return response.data ?? [];
    },
  });

  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: adminKeys.authorityClaims({ status }) });

  /**
   * Shared tail for every decision. Deliberately a plain function: `useMutation`
   * may only be called from the component body, so the three mutations are
   * declared below and delegate their result here.
   */
  const settle = (
    action: 'approve' | 'reject' | 'revoke',
    response: ApiResponse<PropertyAuthorityClaim>,
    claim: PropertyAuthorityClaim
  ) => {
    if (!response.success) {
      setError(response.error ?? 'The decision was not recorded');
      return;
    }
    setError(null);
    setNotice(
      action === 'approve'
        ? `${claim.userEmail ?? 'The claimant'} may now act for that property.`
        : action === 'reject'
          ? 'Claim rejected.'
          : 'Mandate revoked — the publication gate stops counting it immediately.'
    );
    setOpenId(null);
    setReason('');
    setNote('');
    setCanManage(false);
    setCanTransact(false);
    setExpiresInDays('');
    void invalidate();
  };

  // One mutation per action keeps the pending state (and the disabled logic that
  // reads it) independent, which matters when an officer acts on several claims
  // in a row.
  const approve = useMutation({
    mutationFn: (claim: PropertyAuthorityClaim) =>
      propertyAuthorityService.approve(claim.id, {
        canList: true,
        canManage,
        canTransact,
        ...(typeof expiresInDays === 'number' ? { expiresInDays } : {}),
        ...(note.trim() ? { note: note.trim() } : {}),
      }),
    onSuccess: (response, claim) => settle('approve', response, claim),
  });

  const reject = useMutation({
    mutationFn: (claim: PropertyAuthorityClaim) =>
      propertyAuthorityService.reject(claim.id, reason.trim()),
    onSuccess: (response, claim) => settle('reject', response, claim),
  });

  const revoke = useMutation({
    mutationFn: (claim: PropertyAuthorityClaim) =>
      propertyAuthorityService.revoke(claim.id, reason.trim()),
    onSuccess: (response, claim) => settle('revoke', response, claim),
  });

  const busy = approve.isPending || reject.isPending || revoke.isPending;
  const claims = claimsQuery.data ?? [];
  const needsReason = reason.trim().length < MIN_REASON_LENGTH;

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Property Authorities</h1>
          <p className="text-muted-foreground mt-1">
            People acting for a property they do not own — managers, agents, co-owners, POA holders.
          </p>
        </div>
        <div className="w-56">
          <label className="text-sm font-medium text-foreground" htmlFor="status-filter">
            Status
          </label>
          <Select
            ariaLabel="Filter claims by status"
            value={status}
            onValueChange={(value) => setStatus(value as StatusFilter)}
            options={STATUS_OPTIONS}
          />
        </div>
      </div>

      {notice && (
        <div className="rounded-lg border border-green-200 bg-green-50 dark:bg-green-900/20 p-3 text-sm text-green-800 dark:text-green-300">
          {notice}
        </div>
      )}
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 dark:bg-red-900/20 p-3 text-sm text-red-800 dark:text-red-300">
          {error}
        </div>
      )}

      {claimsQuery.isError && (
        <PageErrorState
          title="Could not load authority claims"
          description={(claimsQuery.error as Error).message}
          onRetry={() => void claimsQuery.refetch()}
        />
      )}

      {!claimsQuery.isLoading && !claimsQuery.isError && claims.length === 0 && (
        <EmptyState
          icon={Building2}
          title="Nothing here"
          description={
            status === 'PENDING'
              ? 'No claims are waiting for a decision.'
              : 'No claims match this filter.'
          }
        />
      )}

      <div className="space-y-4">
        {claims.map((claim) => {
          const meta = STATUS_META[claim.status] ?? STATUS_META.EXPIRED;
          const isOpen = openId === claim.id;
          return (
            <Card key={claim.id}>
              <div className="p-5 space-y-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <ShieldCheck className="w-4 h-4 text-muted-foreground" />
                      <span className="font-medium text-foreground">
                        {claim.userEmail ?? claim.userId}
                      </span>
                      <Badge variant={meta.variant}>{meta.label}</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {claim.relationship.replace(/_/g, ' ').toLowerCase()} · property{' '}
                      <span className="font-mono text-xs">{claim.propertyId.slice(0, 8)}</span> ·
                      filed {formatDate(claim.createdAt)}
                    </p>
                    {claim.note && <p className="text-sm text-muted-foreground">“{claim.note}”</p>}
                  </div>

                  <div className="text-right space-y-1">
                    <div className="flex flex-wrap gap-2 justify-end">
                      <Badge variant={claim.canList ? 'info' : 'neutral'}>
                        {claim.canList ? 'Can list' : 'No listing rights'}
                      </Badge>
                      <Badge variant={claim.canManage ? 'info' : 'neutral'}>
                        {claim.canManage ? 'Can manage tenancy' : 'No tenancy rights'}
                      </Badge>
                      <Badge variant={claim.canTransact ? 'success' : 'neutral'}>
                        {claim.canTransact ? 'Can move money' : 'No money rights'}
                      </Badge>
                    </div>
                    {claim.expiresAt && (
                      <p className="text-xs text-muted-foreground">
                        Expires {formatDate(claim.expiresAt)}
                      </p>
                    )}
                    {claim.status === 'ACTIVE' && claim.effective && (
                      <p className="text-xs text-green-700 dark:text-green-400">
                        Counts for publication right now
                      </p>
                    )}
                  </div>
                </div>

                {claim.decisionNote && (
                  <p className="text-xs text-muted-foreground">
                    Officer note: {claim.decisionNote}
                  </p>
                )}

                {(claim.status === 'PENDING' || claim.status === 'ACTIVE') && (
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      onClick={() => {
                        setOpenId(isOpen ? null : claim.id);
                        setError(null);
                        setNotice(null);
                      }}
                    >
                      {isOpen ? 'Cancel' : claim.status === 'PENDING' ? 'Decide' : 'Revoke'}
                    </Button>
                  </div>
                )}

                {isOpen && claim.status === 'PENDING' && (
                  <div className="border-t border-border pt-4 space-y-4">
                    <label className="flex items-start gap-3 text-sm">
                      <input
                        type="checkbox"
                        className="mt-1"
                        checked={canManage}
                        onChange={(event) => setCanManage(event.target.checked)}
                      />
                      <span className="text-muted-foreground">
                        Also allow running the tenancy (units, tenants, applications, leases,
                        maintenance, evictions, expenses). Leave this off for someone who should
                        only advertise the property.
                      </span>
                    </label>

                    <label className="flex items-start gap-3 text-sm">
                      <input
                        type="checkbox"
                        className="mt-1"
                        checked={canTransact}
                        onChange={(event) => setCanTransact(event.target.checked)}
                      />
                      <span className="text-muted-foreground">
                        Also allow money actions (release escrow, accept offers). Leave this off for
                        someone who should only run the day-to-day.
                      </span>
                    </label>

                    <div className="w-56">
                      <label className="text-sm font-medium text-foreground" htmlFor="expiry">
                        Expires after (days, optional)
                      </label>
                      <NumberInput
                        id="expiry"
                        value={expiresInDays}
                        onValueChange={(value) => setExpiresInDays(value)}
                      />
                    </div>

                    <Textarea
                      placeholder="Why this mandate is being granted (recorded with the decision)"
                      value={note}
                      onChange={(event) => setNote(event.target.value)}
                    />

                    <div className="flex flex-wrap gap-3">
                      <Button
                        variant="primary"
                        disabled={busy}
                        onClick={() => approve.mutate(claim)}
                      >
                        Approve mandate
                      </Button>
                    </div>

                    <div className="space-y-2 border-t border-border pt-4">
                      <Textarea
                        placeholder={`Or reject it — reason (at least ${MIN_REASON_LENGTH} characters)`}
                        value={reason}
                        onChange={(event) => setReason(event.target.value)}
                      />
                      <Button
                        variant="outline"
                        disabled={busy || needsReason}
                        onClick={() => reject.mutate(claim)}
                      >
                        <XCircle className="w-4 h-4" />
                        Reject claim
                      </Button>
                    </div>
                  </div>
                )}

                {isOpen && claim.status === 'ACTIVE' && (
                  <div className="border-t border-border pt-4 space-y-3">
                    <Textarea
                      placeholder={`Reason for revoking (at least ${MIN_REASON_LENGTH} characters)`}
                      value={reason}
                      onChange={(event) => setReason(event.target.value)}
                    />
                    <Button
                      variant="danger"
                      disabled={busy || needsReason}
                      onClick={() => revoke.mutate(claim)}
                    >
                      Revoke mandate
                    </Button>
                  </div>
                )}
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
