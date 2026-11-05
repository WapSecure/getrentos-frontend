'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { CircleCheck, FileCheck2, PiggyBank, Scale, ShieldCheck } from 'lucide-react';
import { Alert, Badge, Button, Card, CardSkeleton, EmptyState, Textarea } from '@getrentos/ui';

import { depositHolderText, noDeductionsText } from '@getrentos/shared';
import { unwrap } from '@/lib/apiHelpers';
import { renterKeys } from '@/lib/queryKeys';
import { formatCurrency, formatDate } from '@/lib/format';
import {
  depositPlans,
  type DepositPlan,
  disputeDeduction,
  myDeposits,
  type TenantDeduction,
  type TenantDeposit,
} from '@/services/renterDepositService';

const DEDUCTION: Record<
  TenantDeduction['status'],
  { label: string; variant: 'warning' | 'danger' | 'neutral' }
> = {
  PROPOSED: { label: 'Proposed, not agreed', variant: 'warning' },
  APPROVED: { label: 'Deducted', variant: 'danger' },
  REJECTED: { label: 'Dropped', variant: 'neutral' },
};

const DeductionItem = ({
  d,
  suggestion,
}: {
  d: TenantDeduction;
  /** Grounds and a drafted reason from the deposit-back plan. */
  suggestion?: DepositPlan['disputes'][number];
}) => {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState('');
  const [error, setError] = useState<string | null>(null);
  const dispute = useMutation({
    mutationFn: () => unwrap(disputeDeduction(d.id, reason.trim())),
    onSuccess: () => {
      setOpen(false);
      setReason('');
      setError(null);
      void queryClient.invalidateQueries({ queryKey: renterKeys.deposits });
    },
    onError: (err: Error) => setError(err.message || 'Could not send your dispute.'),
  });
  const status = DEDUCTION[d.status];

  return (
    <li className="py-3">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-medium text-foreground">
            {formatCurrency(d.amount)} · {d.reason}
          </p>
          <p className="text-xs text-muted-foreground">
            {formatDate(d.createdAt)}
            {d.fromInspection && ' · from the move-out inspection (see Inspections)'}
          </p>
        </div>
        <Badge variant={status.variant}>{status.label}</Badge>
      </div>
      {d.decisionNote && d.status === 'REJECTED' && !d.disputeAnswer && (
        <p className="mt-1 text-xs text-muted-foreground">Why it was dropped: {d.decisionNote}</p>
      )}
      {d.disputedAt && (
        <div className="mt-2 rounded-lg bg-muted/50 p-3 text-sm">
          <p className="text-foreground">
            <span className="font-medium">You disputed this:</span> {d.disputeReason}
          </p>
          <p className="mt-1 text-muted-foreground">
            {d.disputeAnswer ? (
              <>
                <span className="font-medium text-foreground">Owner’s answer:</span>{' '}
                {d.disputeAnswer}
              </>
            ) : (
              'Waiting for the owner’s answer. Your deposit cannot be returned until they answer.'
            )}
          </p>
        </div>
      )}
      {d.canDispute &&
        (open ? (
          <div className="mt-2 space-y-2">
            <Textarea
              rows={3}
              aria-label="Why you disagree"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Why you disagree, e.g. the damage was there when you moved in"
            />
            <div className="flex gap-2">
              <Button
                size="sm"
                isLoading={dispute.isPending}
                disabled={reason.trim().length < 10}
                onClick={() => dispute.mutate()}
              >
                Send dispute
              </Button>
              <Button size="sm" variant="ghost" onClick={() => setOpen(false)}>
                Cancel
              </Button>
            </div>
            {error && <Alert variant="danger">{error}</Alert>}
          </div>
        ) : (
          <div className="mt-1">
            {suggestion && (
              <ul className="mb-1 space-y-0.5 text-xs text-muted-foreground">
                {suggestion.grounds.map((g) => (
                  <li key={g}>• {g}</li>
                ))}
              </ul>
            )}
            <Button
              variant="link"
              onClick={() => {
                // Start from the drafted reason; the tenant edits it before sending.
                if (suggestion && !reason) setReason(suggestion.draft);
                setOpen(true);
              }}
              className="font-medium"
            >
              {suggestion ? 'Dispute this (reason drafted)' : 'Dispute this'}
            </Button>
          </div>
        ))}
    </li>
  );
};

const STEP_ICON = { do: CircleCheck, keep: FileCheck2, dispute: Scale } as const;

/** "Getting it back": steps, evidence to keep and deductions worth questioning. */
const DepositPlanPanel = ({ plan, disclaimer }: { plan: DepositPlan; disclaimer: string }) => (
  <section
    aria-label="Getting your deposit back"
    className="mt-4 space-y-2 rounded-lg border border-border p-3"
  >
    <p className="text-sm font-semibold text-foreground">Getting it back</p>
    <p className="text-sm text-foreground">{plan.overview}</p>
    <ul className="space-y-1.5">
      {plan.steps.map((st) => {
        const Icon = STEP_ICON[st.kind];
        return (
          <li key={st.text} className="flex items-start gap-2 text-sm text-foreground">
            <Icon className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden />
            <span>{st.text}</span>
          </li>
        );
      })}
    </ul>
    <p className="text-[11px] text-muted-foreground">{disclaimer}</p>
  </section>
);

const DepositCard = ({
  deposit,
  plan,
  disclaimer,
}: {
  deposit: TenantDeposit;
  plan?: DepositPlan;
  disclaimer: string;
}) => {
  const hold = deposit.hold;
  return (
    <Card className="p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="font-semibold text-foreground">{deposit.propertyTitle}</h3>
          <p className="text-sm text-muted-foreground">{deposit.unitName}</p>
        </div>
        {hold && (
          <Badge variant={hold.status === 'RETURNED' ? 'neutral' : 'success'}>
            {hold.status === 'RETURNED' ? 'Returned' : 'Held'}
          </Badge>
        )}
      </div>

      {!hold ? (
        <div className="mt-3 text-sm text-muted-foreground">
          <p>
            Your lease sets a deposit of{' '}
            <span className="font-medium text-foreground">
              {formatCurrency(deposit.agreedAmount)}
            </span>
            , but it is not recorded as held yet.
          </p>
          {deposit.paidThroughGetRentos?.paid && (
            <p className="mt-1">
              You paid it through GetRentos
              {deposit.paidThroughGetRentos.paidDate && (
                <> on {formatDate(deposit.paidThroughGetRentos.paidDate)}</>
              )}
              .
            </p>
          )}
          <p className="mt-1">
            If you paid it directly, ask your landlord or manager to record it.
          </p>
        </div>
      ) : (
        <>
          <dl className="mt-4 grid gap-3 sm:grid-cols-3">
            <div>
              <dt className="text-xs text-muted-foreground">Deposit</dt>
              <dd className="text-lg font-semibold text-foreground">
                {formatCurrency(hold.amount)}
              </dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground">Deducted</dt>
              <dd className="text-lg font-semibold text-foreground">
                {formatCurrency(hold.summary.approvedDeductions)}
              </dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground">
                {hold.status === 'RETURNED' ? 'Returned to you' : 'Due back to you'}
              </dt>
              <dd className="text-lg font-semibold text-foreground">
                {formatCurrency(
                  hold.status === 'RETURNED' ? (hold.returnedAmount ?? 0) : hold.summary.returnable
                )}
              </dd>
            </div>
          </dl>
          {hold.summary.proposedDeductions > 0 && hold.status !== 'RETURNED' && (
            <p className="mt-2 text-sm text-muted-foreground">
              {formatCurrency(hold.summary.proposedDeductions)} more is proposed but not agreed, so
              it is not counted yet.
            </p>
          )}
          <p className="mt-3 flex items-start gap-1.5 text-sm text-muted-foreground">
            <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-success" aria-hidden />
            {depositHolderText(hold)}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            Recorded {formatDate(hold.takenAt)}
            {hold.returnedAt && <> · returned {formatDate(hold.returnedAt)}</>}
          </p>

          <h4 className="mt-4 text-sm font-semibold text-foreground">Deductions</h4>
          {hold.deductions.length === 0 ? (
            <p className="mt-1 text-sm text-muted-foreground">
              {noDeductionsText(hold.status === 'RETURNED')}
            </p>
          ) : (
            <ul className="divide-y divide-border">
              {hold.deductions.map((d) => (
                <DeductionItem
                  key={d.id}
                  d={d}
                  suggestion={plan?.disputes.find((x) => x.deductionId === d.id)}
                />
              ))}
            </ul>
          )}
        </>
      )}
      {plan && <DepositPlanPanel plan={plan} disclaimer={disclaimer} />}
    </Card>
  );
};

/**
 * The tenant's deposit: how much, who holds it, every claim on it and what
 * comes back. Claims the tenant disagrees with can be disputed here, and the
 * deposit is not returned until the owner has answered.
 */
export const DepositSection = () => {
  const deposits = useQuery({
    queryKey: renterKeys.deposits,
    queryFn: () => unwrap(myDeposits()),
  });
  // Hidden if it fails: the deposit itself is shown either way.
  const plans = useQuery({
    queryKey: renterKeys.depositPlan,
    queryFn: () => unwrap(depositPlans()),
    staleTime: 5 * 60_000,
    retry: false,
  });

  return (
    <div className="space-y-4">
      <div>
        <h2 className="flex items-center gap-2 text-lg font-semibold text-foreground">
          <PiggyBank className="h-5 w-5 text-primary" aria-hidden />
          Your deposit
        </h2>
        <p className="text-sm text-muted-foreground">
          What you paid, who holds it, and anything taken from it, with the reason.
        </p>
      </div>
      {deposits.isLoading ? (
        <CardSkeleton lines={4} />
      ) : deposits.isError && !deposits.data ? (
        <Alert variant="danger">
          {(deposits.error as Error).message || 'Could not load your deposit.'}
        </Alert>
      ) : (deposits.data ?? []).length === 0 ? (
        <EmptyState
          icon={PiggyBank}
          title="No deposit on record for your tenancies."
          size="compact"
        />
      ) : (
        (deposits.data ?? []).map((d) => (
          <DepositCard
            key={d.leaseId}
            deposit={d}
            plan={plans.data?.plans.find((p) => p.leaseId === d.leaseId)}
            disclaimer={plans.data?.disclaimer ?? ''}
          />
        ))
      )}
    </div>
  );
};
