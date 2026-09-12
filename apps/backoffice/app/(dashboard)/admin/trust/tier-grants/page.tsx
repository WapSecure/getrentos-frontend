'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { BadgeCheck, KeyRound, ShieldCheck } from 'lucide-react';
import {
  Badge,
  Button,
  Card,
  ConfirmDialog,
  EmptyState,
  Input,
  NumberInput,
  PageErrorState,
  Pagination,
  Select,
  Textarea,
  type BadgeVariant,
} from '@getrentos/ui';
import { formatDate, unwrap } from '@getrentos/shared';
import { trustService } from '@/services/trustService';
import { adminKeys } from '@/lib/queryKeys';
import type { TierGrant, TierGrantState } from '@/types/trust';

type StateFilter = 'all' | TierGrantState;

const PAGE_SIZE = 12;
/** Mirrors the server DTO floor — a grant moves money, so "why" is mandatory. */
const MIN_REASON_LENGTH = 10;

const STATE_OPTIONS: { value: StateFilter; label: string }[] = [
  { value: 'all', label: 'All states' },
  { value: 'ACTIVE', label: 'Active' },
  { value: 'REVOKED', label: 'Revoked' },
  { value: 'EXPIRED', label: 'Expired' },
];

const STATE_META: Record<TierGrantState, { label: string; variant: BadgeVariant }> = {
  ACTIVE: { label: 'Active', variant: 'success' },
  EXPIRED: { label: 'Expired', variant: 'neutral' },
  REVOKED: { label: 'Revoked', variant: 'danger' },
};

/**
 * Manual tier-3 (financial capability) grants.
 *
 * A grant is the backoffice answer for a host who cannot pass the automated bank
 * name enquiry (offline statement, unlisted bank). It confers the SAME
 * capability as a passing bank check, so every grant requires a reason, is
 * audited, and can be withdrawn — a revoked grant drops the user back to the
 * tier their other evidence supports.
 */
export default function TierGrantsPage() {
  const queryClient = useQueryClient();
  const [stateFilter, setStateFilter] = useState<StateFilter>('all');
  const [page, setPage] = useState(1);

  const [userId, setUserId] = useState('');
  const [reason, setReason] = useState('');
  const [expiresInDays, setExpiresInDays] = useState('');
  const [formError, setFormError] = useState<string | null>(null);
  const [granted, setGranted] = useState<TierGrant | null>(null);

  const [revokeTarget, setRevokeTarget] = useState<TierGrant | null>(null);
  const [revokeReason, setRevokeReason] = useState('');

  const { data, isLoading, isError, isFetching, refetch } = useQuery({
    queryKey: adminKeys.tierGrants({
      state: stateFilter === 'all' ? undefined : stateFilter,
      page,
      pageSize: PAGE_SIZE,
    }),
    queryFn: () =>
      unwrap(
        trustService.listTierGrants({
          state: stateFilter === 'all' ? undefined : stateFilter,
          page,
          pageSize: PAGE_SIZE,
        })
      ),
  });
  const grants = data?.items ?? [];
  const total = data?.total ?? 0;

  const invalidate = () =>
    void queryClient.invalidateQueries({ queryKey: ['admin', 'trust', 'tier-grants'] });

  const grantMutation = useMutation({
    mutationFn: () =>
      unwrap(
        trustService.grantTier3({
          userId: userId.trim(),
          reason: reason.trim(),
          expiresInDays: expiresInDays ? Number(expiresInDays) : undefined,
        })
      ),
    onSuccess: (result) => {
      setFormError(null);
      setGranted(result);
      setUserId('');
      setReason('');
      setExpiresInDays('');
      invalidate();
    },
    onError: (error) =>
      setFormError(error instanceof Error ? error.message : 'Unable to record the grant.'),
  });

  const revokeMutation = useMutation({
    mutationFn: (target: TierGrant) =>
      unwrap(trustService.revokeTierGrant(target.userId, revokeReason.trim())),
    onSuccess: () => {
      setRevokeTarget(null);
      setRevokeReason('');
      invalidate();
    },
    onError: (error) =>
      setFormError(error instanceof Error ? error.message : 'Unable to revoke the grant.'),
  });

  const submitGrant = () => {
    if (!userId.trim()) {
      setFormError('Enter the user id of the person receiving financial capability.');
      return;
    }
    if (reason.trim().length < MIN_REASON_LENGTH) {
      setFormError(`Give a reason of at least ${MIN_REASON_LENGTH} characters — it is audited.`);
      return;
    }
    setGranted(null);
    grantMutation.mutate();
  };

  return (
    <>
      <div className="mb-6">
        <h1 className="flex items-center gap-2 text-2xl font-bold text-foreground">
          <ShieldCheck className="h-6 w-6 text-primary" />
          Tier 3 Grants
        </h1>
        <p className="mt-1 text-muted-foreground">
          Financial capability granted by hand, for hosts who cannot pass the automated bank name
          enquiry. A grant counts exactly like a passing bank check, so it is audited, can carry an
          expiry, and can be withdrawn at any time.
        </p>
      </div>

      <Card static className="mb-6">
        <div className="p-6">
          <h2 className="mb-4 flex items-center gap-2 text-sm font-semibold text-foreground">
            <KeyRound className="h-4 w-4 text-primary" />
            Grant financial verification
          </h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label
                className="mb-1 block text-xs font-medium text-muted-foreground"
                htmlFor="grant-user"
              >
                User id
              </label>
              <Input
                id="grant-user"
                value={userId}
                onChange={(event) => setUserId(event.target.value)}
                placeholder="e.g. 8f8d1f9e-5540-4fcb-afd1-d13c9ed93534"
              />
            </div>
            <div className="sm:col-span-2">
              <label
                className="mb-1 block text-xs font-medium text-muted-foreground"
                htmlFor="grant-reason"
              >
                Reason (audited — required)
              </label>
              <Textarea
                id="grant-reason"
                value={reason}
                onChange={(event) => setReason(event.target.value)}
                rows={3}
                placeholder="Offline bank statement verified at branch, ref CB-2291"
              />
            </div>
            <div>
              <label
                className="mb-1 block text-xs font-medium text-muted-foreground"
                htmlFor="grant-expiry"
              >
                Expires in (days, optional)
              </label>
              <NumberInput
                id="grant-expiry"
                value={expiresInDays}
                onValueChange={setExpiresInDays}
                placeholder="Blank = open-ended"
              />
            </div>
          </div>

          {formError && <p className="mt-3 text-sm text-destructive">{formError}</p>}
          {granted && !formError && (
            <p className="mt-3 flex items-center gap-2 text-sm text-green-700 dark:text-green-400">
              <BadgeCheck className="h-4 w-4" />
              Grant recorded for {granted.userEmail ?? granted.userId} — they now hold trust tier 3.
            </p>
          )}

          <div className="mt-4">
            <Button onClick={submitGrant} disabled={grantMutation.isPending}>
              {grantMutation.isPending ? 'Recording…' : 'Grant tier 3'}
            </Button>
          </div>
        </div>
      </Card>

      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center">
        <Select
          value={stateFilter}
          onValueChange={(value) => {
            setStateFilter(value as StateFilter);
            setPage(1);
          }}
          options={STATE_OPTIONS}
          className="w-full sm:w-44"
        />
      </div>

      {isError ? (
        <PageErrorState
          title="Could not load tier-3 grants"
          description="The grants register is temporarily unavailable."
          onRetry={() => void refetch()}
          isRetrying={isFetching}
        />
      ) : isLoading ? (
        <div className="flex justify-center py-16">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
      ) : grants.length === 0 ? (
        <EmptyState icon={ShieldCheck} title="No tier-3 grants match your filters" />
      ) : (
        <div className="grid gap-4">
          {grants.map((grant) => (
            <Card key={grant.id} static>
              <div className="flex flex-col gap-3 p-6 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-sm font-semibold text-foreground">
                      {grant.userEmail ?? grant.userId}
                    </span>
                    <Badge variant={STATE_META[grant.state].variant}>
                      {STATE_META[grant.state].label}
                    </Badge>
                    {grant.effective && (
                      <span className="text-xs text-muted-foreground">counts today</span>
                    )}
                  </div>
                  <p className="mt-2 text-sm text-muted-foreground">
                    {grant.reason ?? 'No reason recorded'}
                  </p>
                  <p className="mt-2 text-xs text-muted-foreground">
                    Granted {formatDate(grant.grantedAt)}
                    {grant.grantedById ? ` by ${grant.grantedById}` : ''} ·{' '}
                    {grant.expiresAt ? `expires ${formatDate(grant.expiresAt)}` : 'no expiry'}
                  </p>
                  {grant.state === 'REVOKED' && (
                    <p className="mt-1 text-xs text-red-600 dark:text-red-400">
                      Revoked{grant.revokedAt ? ` ${formatDate(grant.revokedAt)}` : ''}
                      {grant.revokedById ? ` by ${grant.revokedById}` : ''}
                    </p>
                  )}
                </div>
                {grant.effective && (
                  <Button
                    variant="outline"
                    onClick={() => {
                      setFormError(null);
                      setRevokeReason('');
                      setRevokeTarget(grant);
                    }}
                  >
                    Revoke
                  </Button>
                )}
              </div>
            </Card>
          ))}
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

      <ConfirmDialog
        open={Boolean(revokeTarget)}
        onOpenChange={(open) => {
          if (!open) setRevokeTarget(null);
        }}
        title="Revoke this tier-3 grant?"
        description={
          revokeTarget
            ? `${revokeTarget.userEmail ?? revokeTarget.userId} loses trust tier 3 immediately and drops back to the tier their other evidence supports.`
            : ''
        }
        confirmLabel="Revoke grant"
        isLoading={revokeMutation.isPending}
        onConfirm={() => revokeTarget && revokeMutation.mutateAsync(revokeTarget)}
        promptLabel="Reason (audited)"
        promptPlaceholder="Referred back to the automated bank check after risk review"
        promptValue={revokeReason}
        onPromptChange={setRevokeReason}
        promptRequired
        promptMinLength={MIN_REASON_LENGTH}
      />
    </>
  );
}
