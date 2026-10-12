'use client';

import { useState } from 'react';
import {
  Button,
  ConfirmDialog,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
  Textarea,
} from '@getrentos/ui';
import { CheckCircle2, Circle, CircleAlert, CircleDot, MinusCircle } from 'lucide-react';
import { formatDate } from '@/lib/format';
import type { LandMilestone } from '@/types/landBuyer';
import { MilestoneStatusBadge } from './LandSaleBadges';
import { bpsToPercent, milestoneAction } from './landSaleLogic';

const REASON_MIN = 5;
const REASON_MAX = 2000;

const ICONS = {
  PENDING: Circle,
  DELIVERED: CircleDot,
  CONFIRMED: CheckCircle2,
  DISPUTED: CircleAlert,
  WAIVED: MinusCircle,
} as const;

const ICON_TONE = {
  PENDING: 'text-muted-foreground',
  DELIVERED: 'text-warning',
  CONFIRMED: 'text-success',
  DISPUTED: 'text-destructive',
  WAIVED: 'text-info',
} as const;

/** Asks why a delivered step is wrong; the developer sees the reason and re-delivers. */
const DisputeDialog = ({
  milestone,
  onClose,
  onSubmit,
  isLoading,
}: {
  milestone: LandMilestone | null;
  onClose: () => void;
  onSubmit: (reason: string) => Promise<unknown>;
  isLoading: boolean;
}) => {
  const [reason, setReason] = useState('');
  const trimmed = reason.trim();
  const close = () => {
    setReason('');
    onClose();
  };
  return (
    <Dialog open={Boolean(milestone)} onOpenChange={(open) => !open && close()}>
      <DialogContent>
        <form
          className="space-y-4 p-5"
          onSubmit={async (e) => {
            e.preventDefault();
            if (trimmed.length < REASON_MIN) return;
            try {
              await onSubmit(trimmed);
              close();
            } catch {
              // The caller reports the API's message.
            }
          }}
        >
          <DialogTitle className="text-lg font-semibold text-foreground">
            Dispute “{milestone?.label}”
          </DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground">
            Tell the seller what is wrong with this step. No money is released for it while it is
            disputed; they will deliver it again.
          </DialogDescription>
          <div className="space-y-1.5">
            <label htmlFor="milestone-dispute" className="text-sm font-medium text-foreground">
              What is wrong?
            </label>
            <Textarea
              id="milestone-dispute"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={4}
              maxLength={REASON_MAX}
              required
              minLength={REASON_MIN}
              placeholder="e.g. The deed names the wrong plot number."
            />
            <p className="text-xs text-muted-foreground">
              At least {REASON_MIN} characters. {trimmed.length}/{REASON_MAX}
            </p>
          </div>
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Button type="button" variant="ghost" onClick={close} disabled={isLoading}>
              Cancel
            </Button>
            <Button
              type="submit"
              variant="danger"
              isLoading={isLoading}
              disabled={trimmed.length < REASON_MIN || isLoading}
            >
              Dispute step
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

/**
 * Conveyance steps in order, with Confirm and Dispute on a delivered step.
 * Shared by developer purchases (`showRelease`: each confirmation releases a
 * share of escrow) and land resales (escrow releases once the required steps
 * are all confirmed).
 */
export const MilestoneTimeline = ({
  milestones,
  contractOpen,
  requiredOnly = false,
  showRelease = false,
  onConfirm,
  onDispute,
  pendingKey,
}: {
  milestones: LandMilestone[];
  /** False once the contract has ended: nothing can be confirmed or disputed. */
  contractOpen: boolean;
  /** Resales only block on earlier required steps. */
  requiredOnly?: boolean;
  showRelease?: boolean;
  onConfirm: (key: string) => Promise<unknown>;
  onDispute: (key: string, reason: string) => Promise<unknown>;
  /** The step whose request is in flight. */
  pendingKey?: string | null;
}) => {
  const [confirming, setConfirming] = useState<LandMilestone | null>(null);
  const [disputing, setDisputing] = useState<LandMilestone | null>(null);
  const ordered = [...milestones].sort((a, b) => a.sequence - b.sequence);

  if (ordered.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">No conveyance steps have been set up yet.</p>
    );
  }

  return (
    <>
      <ol className="relative space-y-5 border-l border-border pl-6">
        {ordered.map((m) => {
          const Icon = ICONS[m.status];
          const action = milestoneAction(ordered, m, { requiredOnly, contractOpen });
          return (
            <li key={m.key} className="relative">
              <Icon
                className={`absolute -left-[33px] top-0.5 h-5 w-5 bg-background ${ICON_TONE[m.status]}`}
                aria-hidden
              />
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="font-medium text-foreground">{m.label}</h3>
                <MilestoneStatusBadge status={m.status} />
                {!m.required && <span className="text-xs text-muted-foreground">Optional</span>}
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                {[
                  showRelease && m.releaseBps > 0
                    ? `Releases ${bpsToPercent(m.releaseBps)} of the price to the developer`
                    : null,
                  m.deliveredAt ? `Delivered ${formatDate(m.deliveredAt)}` : null,
                  m.confirmedAt ? `Confirmed ${formatDate(m.confirmedAt)}` : null,
                ]
                  .filter(Boolean)
                  .join(' · ')}
              </p>
              {m.note && (
                <p className="mt-1.5 rounded-lg bg-secondary/60 px-3 py-2 text-sm text-foreground">
                  Seller&apos;s note: {m.note}
                </p>
              )}
              {m.status === 'DISPUTED' && m.disputeReason && (
                <p className="mt-1.5 rounded-lg bg-destructive/5 px-3 py-2 text-sm text-destructive">
                  You disputed this: {m.disputeReason}
                </p>
              )}
              {m.status === 'DELIVERED' && contractOpen && (
                <div className="mt-3 space-y-2">
                  {action.blockedBy.length > 0 && (
                    <p className="text-xs text-muted-foreground">
                      Confirm earlier steps first: {action.blockedBy.join('; ')}.
                    </p>
                  )}
                  <div className="flex flex-wrap gap-2">
                    <Button
                      size="sm"
                      onClick={() => setConfirming(m)}
                      disabled={!action.canConfirm || pendingKey === m.key}
                      isLoading={pendingKey === m.key && Boolean(confirming)}
                    >
                      Confirm
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setDisputing(m)}
                      disabled={!action.canDispute || pendingKey === m.key}
                    >
                      Dispute
                    </Button>
                  </div>
                </div>
              )}
            </li>
          );
        })}
      </ol>

      <ConfirmDialog
        open={Boolean(confirming)}
        onOpenChange={(open) => !open && setConfirming(null)}
        title={`Confirm “${confirming?.label ?? ''}”?`}
        description={
          showRelease && confirming && confirming.releaseBps > 0
            ? `Only confirm once you have it in hand. Confirming releases ${bpsToPercent(confirming.releaseBps)} of the price from escrow to the developer, and cannot be undone.`
            : 'Only confirm once you have it in hand. Confirming tells us the step is done and cannot be undone.'
        }
        confirmLabel="Confirm step"
        isLoading={Boolean(confirming) && pendingKey === confirming?.key}
        onConfirm={() => (confirming ? onConfirm(confirming.key).catch(() => undefined) : null)}
      />
      <DisputeDialog
        milestone={disputing}
        onClose={() => setDisputing(null)}
        isLoading={Boolean(disputing) && pendingKey === disputing?.key}
        onSubmit={(reason) => onDispute(disputing!.key, reason)}
      />
    </>
  );
};
