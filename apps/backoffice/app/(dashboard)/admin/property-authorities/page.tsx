'use client';

import { useState } from 'react';
import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Building2, ShieldCheck, XCircle } from '@sureground/icons';
import {
  Alert,
  Badge,
  Button,
  Card,
  Checkbox,
  EmptyState,
  Field,
  ListSkeleton,
  NumberInput,
  PageErrorState,
  Select,
  Textarea,
  type BadgeVariant,
  PageHeader,
} from '@sureground/ui';
import { formatDate, type ApiResponse } from '@sureground/shared';
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

// A mandate opens up someone else's property, so a reason is recorded with every decision.
const MIN_REASON_LENGTH = 10;

// canList, canManage and canTransact are separate, escalating grants over someone else's property, so each stays an explicit choice.
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
    placeholderData: keepPreviousData,
  });

  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: adminKeys.authorityClaims({ status }) });

  // A plain function, not a hook: useMutation may only be called from the component body.
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
          : 'Mandate revoked: the publication gate stops counting it immediately.'
    );
    setOpenId(null);
    setReason('');
    setNote('');
    setCanManage(false);
    setCanTransact(false);
    setExpiresInDays('');
    void invalidate();
  };

  // NumberInput returns a numeric string, so parse it; a number-only check silently granted mandates with no expiry.
  const expiryDays = Number.parseInt(String(expiresInDays), 10);
  const hasExpiry = Number.isSafeInteger(expiryDays) && expiryDays > 0;
  const reportMutationError = (mutationError: unknown) =>
    setError(
      mutationError instanceof Error
        ? mutationError.message
        : 'The decision could not be recorded. Your inputs have been preserved.'
    );

  // One mutation per action keeps each pending state independent when an officer acts on several claims in a row.
  const approve = useMutation({
    mutationFn: (claim: PropertyAuthorityClaim) =>
      propertyAuthorityService.approve(claim.id, {
        canList: true,
        canManage,
        canTransact,
        ...(hasExpiry ? { expiresInDays: expiryDays } : {}),
        ...(note.trim() ? { note: note.trim() } : {}),
      }),
    onSuccess: (response, claim) => settle('approve', response, claim),
    onError: reportMutationError,
  });

  const reject = useMutation({
    mutationFn: (claim: PropertyAuthorityClaim) =>
      propertyAuthorityService.reject(claim.id, reason.trim()),
    onSuccess: (response, claim) => settle('reject', response, claim),
    onError: reportMutationError,
  });

  const revoke = useMutation({
    mutationFn: (claim: PropertyAuthorityClaim) =>
      propertyAuthorityService.revoke(claim.id, reason.trim()),
    onSuccess: (response, claim) => settle('revoke', response, claim),
    onError: reportMutationError,
  });

  const busy = approve.isPending || reject.isPending || revoke.isPending;
  const claims = claimsQuery.data ?? [];
  const needsReason = reason.trim().length < MIN_REASON_LENGTH;

  return (
    <div className="p-6 space-y-6">
      <PageHeader
        title="Property Authorities"
        description="People acting for a property they do not own: managers, agents, co-owners, POA holders."
        actions={
          <Field label="Status" className="w-full sm:w-56">
            <Select
              value={status}
              onValueChange={(value) => setStatus(value as StatusFilter)}
              options={STATUS_OPTIONS}
            />
          </Field>
        }
      />

      {notice && (
        <Alert variant="success" onDismiss={() => setNotice(null)}>
          {notice}
        </Alert>
      )}
      {error && (
        <Alert variant="danger" onDismiss={() => setError(null)}>
          {error}
        </Alert>
      )}

      {claimsQuery.isError && !claimsQuery.data && (
        <PageErrorState
          title="Could not load authority claims"
          description={(claimsQuery.error as Error).message}
          onRetry={() => void claimsQuery.refetch()}
          isRetrying={claimsQuery.isFetching}
          headingLevel="h2"
        />
      )}

      {claimsQuery.isLoading && (
        <ListSkeleton rows={3} variant="cards" label="Loading authority claims" />
      )}

      {claimsQuery.data && claims.length === 0 && (
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
                    <div className="flex flex-wrap items-center gap-2">
                      <ShieldCheck className="w-4 h-4 text-muted-foreground" />
                      <span className="min-w-0 break-all font-medium text-foreground">
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

                  <div className="space-y-1 sm:text-right">
                    <div className="flex flex-wrap gap-2 sm:justify-end">
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
                      <p className="text-xs text-success">Counts for publication right now</p>
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
                    <Checkbox
                      checked={canManage}
                      onCheckedChange={setCanManage}
                      label="Also allow running the tenancy"
                      description="Units, tenants, applications, leases, maintenance, evictions, expenses. Leave this off for someone who should only advertise the property."
                    />

                    <Checkbox
                      checked={canTransact}
                      onCheckedChange={setCanTransact}
                      label="Also allow money actions"
                      description="Release escrow, accept offers. Leave this off for someone who should only run the day-to-day."
                    />

                    <Field
                      label="Expires after (days)"
                      optionalLabel="optional"
                      className="w-full sm:w-56"
                    >
                      <NumberInput
                        value={expiresInDays}
                        onValueChange={(value) => setExpiresInDays(value)}
                      />
                    </Field>

                    <Field label="Decision note" optionalLabel="optional">
                      <Textarea
                        placeholder="Why this mandate is being granted (recorded with the decision)"
                        value={note}
                        onChange={(event) => setNote(event.target.value)}
                      />
                    </Field>

                    <div className="flex flex-wrap gap-3">
                      <Button
                        variant="primary"
                        disabled={busy}
                        isLoading={approve.isPending}
                        onClick={() => approve.mutate(claim)}
                      >
                        Approve mandate
                      </Button>
                    </div>

                    <div className="space-y-2 border-t border-border pt-4">
                      <Field label="Or reject it">
                        <Textarea
                          placeholder={`Reason (at least ${MIN_REASON_LENGTH} characters)`}
                          value={reason}
                          onChange={(event) => setReason(event.target.value)}
                        />
                      </Field>
                      <Button
                        variant="outline"
                        disabled={busy || needsReason}
                        isLoading={reject.isPending}
                        icon={<XCircle className="h-4 w-4" />}
                        onClick={() => reject.mutate(claim)}
                      >
                        Reject claim
                      </Button>
                    </div>
                  </div>
                )}

                {isOpen && claim.status === 'ACTIVE' && (
                  <div className="border-t border-border pt-4 space-y-3">
                    <Field label="Reason for revoking" required>
                      <Textarea
                        placeholder={`At least ${MIN_REASON_LENGTH} characters`}
                        value={reason}
                        onChange={(event) => setReason(event.target.value)}
                      />
                    </Field>
                    <Button
                      variant="danger"
                      disabled={busy || needsReason}
                      isLoading={revoke.isPending}
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
