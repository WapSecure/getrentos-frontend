'use client';

import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Check } from 'lucide-react';
import { Button, Checkbox } from '@getrentos/ui';

import { unwrap } from '@/lib/apiHelpers';
import { formatCurrency, formatDate } from '@/lib/format';
import {
  acceptProposal,
  withdrawIntake,
  type ManagedIntake,
  type ManagedIntakeStatus,
} from '@/services/managedIntakeService';

const STEPS: { status: ManagedIntakeStatus; label: string }[] = [
  { status: 'SUBMITTED', label: 'Requested' },
  { status: 'ASSESSMENT_SCHEDULED', label: 'Visit booked' },
  { status: 'ASSESSED', label: 'Assessed' },
  { status: 'PROPOSED', label: 'Proposal' },
  { status: 'ACCEPTED', label: 'Accepted' },
];

const stepIndex = (status: ManagedIntakeStatus) => STEPS.findIndex((s) => s.status === status);

const lagosDateTime = (iso: string) =>
  new Date(iso).toLocaleString('en-NG', {
    timeZone: 'Africa/Lagos',
    dateStyle: 'medium',
    timeStyle: 'short',
  });

/**
 * Where an owner's GetRentos Managed request stands, under its property. The
 * proposal is accepted here, and accepting is signing, so the agreement is an
 * explicit tick rather than implied by the button.
 */
export const ManagedIntakePanel = ({
  intake,
  onChanged,
}: {
  intake: ManagedIntake;
  onChanged: () => void;
}) => {
  const [agree, setAgree] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Accepted is the last step and it is complete, not in progress.
  const current = intake.status === 'ACCEPTED' ? STEPS.length : stepIndex(intake.status);
  const proposal = intake.proposal;

  const accept = useMutation({
    mutationFn: () => unwrap(acceptProposal(intake.id)),
    onSuccess: () => {
      setError(null);
      onChanged();
    },
    onError: (err: Error) => setError(err.message || 'Could not accept the proposal.'),
  });
  const withdraw = useMutation({
    mutationFn: () => unwrap(withdrawIntake(intake.id)),
    onSuccess: () => {
      setError(null);
      onChanged();
    },
    onError: (err: Error) => setError(err.message || 'Could not withdraw the request.'),
  });

  return (
    <div className="mt-3 border-t border-border pt-3">
      <ol className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs">
        {STEPS.map((step, i) => (
          <li key={step.status} className="flex items-center gap-1.5">
            <span
              className={`flex h-5 w-5 items-center justify-center rounded-full border ${
                i < current
                  ? 'border-success bg-success text-white'
                  : i === current
                    ? 'border-primary text-primary'
                    : 'border-border text-muted-foreground'
              }`}
            >
              {i < current ? <Check className="h-3 w-3" aria-hidden /> : i + 1}
            </span>
            <span
              className={i === current ? 'font-medium text-foreground' : 'text-muted-foreground'}
            >
              {step.label}
            </span>
            {i < STEPS.length - 1 && <span className="text-muted-foreground">·</span>}
          </li>
        ))}
      </ol>

      <div className="mt-3 text-sm text-muted-foreground">
        {intake.status === 'SUBMITTED' && (
          <p>
            We have your request. Next, GetRentos books a site visit. Indicative fee{' '}
            {intake.indicativeFeePct}% of rent collected
            {intake.indicativeMonthlyFee !== null && (
              <> (about {formatCurrency(intake.indicativeMonthlyFee)} a month)</>
            )}
            .
          </p>
        )}
        {intake.status === 'ASSESSMENT_SCHEDULED' && intake.assessmentScheduledFor && (
          <p>
            {intake.assessorName ?? 'A GetRentos assessor'} visits on{' '}
            <span className="font-medium text-foreground">
              {lagosDateTime(intake.assessmentScheduledFor)}
            </span>
            .
          </p>
        )}
        {intake.status === 'ASSESSED' && <p>We visited. Your proposal is being prepared.</p>}
        {intake.status === 'ACCEPTED' && (
          <p>
            You accepted on {formatDate(intake.acceptedAt ?? intake.createdAt)}. GetRentos assigns
            your portfolio manager and takes over once the opening balances are confirmed.
          </p>
        )}
      </div>

      {intake.status === 'PROPOSED' && proposal && (
        <div className="mt-3 rounded-xl border border-primary/40 bg-primary/5 p-4">
          <p className="font-medium text-foreground">
            Our proposal: {proposal.tierName} at {proposal.feePct}% of rent collected
          </p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Letting {proposal.lettingCommissionPct}% · renewal {proposal.renewalCommissionPct}%
            {proposal.expiresAt && <> · valid until {formatDate(proposal.expiresAt)}</>}
          </p>
          {proposal.includes.length > 0 && (
            <ul className="mt-2 space-y-1">
              {proposal.includes.map((line) => (
                <li key={line} className="flex items-start gap-1.5 text-sm text-foreground">
                  <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-success" aria-hidden />
                  {line}
                </li>
              ))}
            </ul>
          )}
          {proposal.exclusions && (
            <p className="mt-2 text-sm text-foreground">
              <span className="font-medium">Not included:</span> {proposal.exclusions}
            </p>
          )}
          {proposal.note && <p className="mt-2 text-sm text-muted-foreground">{proposal.note}</p>}
          {intake.findings && (
            <p className="mt-2 text-sm text-muted-foreground">
              <span className="font-medium text-foreground">From our visit:</span> {intake.findings}
            </p>
          )}

          {intake.proposalExpired ? (
            <p className="mt-3 text-sm text-destructive">
              This proposal has lapsed. Contact GetRentos for a fresh one.
            </p>
          ) : (
            <>
              <label className="mt-3 flex items-start gap-2 text-sm text-foreground">
                <Checkbox
                  checked={agree}
                  onCheckedChange={setAgree}
                  aria-label="Agree to the management terms"
                />
                <span>
                  I agree to GetRentos managing this property on these terms. Accepting signs the
                  management agreement.
                </span>
              </label>
              <Button
                isLoading={accept.isPending}
                disabled={!agree}
                onClick={() => accept.mutate()}
              >
                Accept and sign
              </Button>
            </>
          )}
        </div>
      )}

      {error && (
        <p className="mt-3 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {error}
        </p>
      )}

      {intake.status !== 'ACCEPTED' && (
        <button
          type="button"
          disabled={withdraw.isPending}
          onClick={() => withdraw.mutate()}
          className="mt-3 text-sm text-muted-foreground hover:text-destructive disabled:opacity-50"
        >
          {withdraw.isPending ? 'Withdrawing…' : 'Withdraw request'}
        </button>
      )}
    </div>
  );
};
