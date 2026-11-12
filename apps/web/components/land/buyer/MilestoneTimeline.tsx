'use client';

import { useState } from 'react';
import { Button, ConfirmDialog, EmptyState, ReasonDialog, Timeline } from '@sureground/ui';
import { ListChecks } from '@sureground/icons';
import { formatDate } from '@/lib/format';
import { milestoneStates } from '@/lib/stepStates';
import type { LandMilestone } from '@/types/landBuyer';
import type { WorkspaceMilestone } from '@/types/transactionWorkspace';
import { MilestoneStatusBadge } from './LandSaleBadges';
import { bpsToPercent, milestoneAction } from './landSaleLogic';

const REASON_MIN = 5;
const REASON_MAX = 2000;

const DEFAULT_DISPUTE_DESCRIPTION =
  'Tell the seller what is wrong with this step. No money is released for it while it is disputed; they will deliver it again.';

// Developer purchases release a share of the price per confirmation; resales once every required step is confirmed; built homes track only.
export const MilestoneTimeline = ({
  milestones,
  contractOpen,
  requiredOnly = false,
  showRelease = false,
  onConfirm,
  onDispute,
  pendingKey,
  ariaLabel = 'Conveyance steps',
  empty = {
    title: 'No conveyance steps yet',
    description:
      'The steps to transfer this land, and their progress, will appear here once set up.',
  },
  disputeDescription = DEFAULT_DISPUTE_DESCRIPTION,
  awaitingLabel,
}: {
  milestones: (LandMilestone | WorkspaceMilestone)[];
  contractOpen: boolean;
  /** Resales only block on earlier required steps. */
  requiredOnly?: boolean;
  showRelease?: boolean;
  /** Without both, the steps are read only (a seller's or representative's view). */
  onConfirm?: (key: string) => Promise<unknown>;
  onDispute?: (key: string, reason: string) => Promise<unknown>;
  pendingKey?: string | null;
  ariaLabel?: string;
  empty?: { title: string; description: string };
  disputeDescription?: string;
  /** The badge on a delivered step, when the viewer is not the one to confirm it. */
  awaitingLabel?: string;
}) => {
  const canAct = Boolean(onConfirm && onDispute);
  const [confirming, setConfirming] = useState<LandMilestone | null>(null);
  const [disputing, setDisputing] = useState<LandMilestone | null>(null);
  const ordered = [...milestones].sort((a, b) => a.sequence - b.sequence);
  // One current step: the earliest awaiting confirmation, else the next to be delivered.
  const states = milestoneStates(ordered.map((m) => m.status));

  if (ordered.length === 0) {
    return (
      <EmptyState
        icon={ListChecks}
        title={empty.title}
        description={empty.description}
        size="compact"
        bare
      />
    );
  }

  return (
    <>
      <Timeline
        titleAs="h3"
        aria-label={ariaLabel}
        items={ordered.map((m, index) => {
          const action = milestoneAction(ordered, m, { requiredOnly, contractOpen });
          const settled = m.status === 'CONFIRMED' || m.status === 'WAIVED';
          const verifiedBy = 'verifiedBy' in m ? m.verifiedBy : undefined;
          return {
            id: m.key,
            title: m.label,
            state: states[index],
            badge: (
              <>
                <MilestoneStatusBadge
                  status={m.status}
                  label={m.status === 'DELIVERED' ? awaitingLabel : undefined}
                />
                {!m.required && <span className="text-xs text-muted-foreground">Optional</span>}
              </>
            ),
            description: (
              <>
                <p>
                  {[
                    showRelease && m.releaseBps > 0
                      ? `Releases ${bpsToPercent(m.releaseBps)} of the price to the developer`
                      : null,
                    m.dueDate && !settled ? `Expected by ${formatDate(m.dueDate)}` : null,
                    (m.escalationLevel ?? 0) > 1 && !settled
                      ? 'More than 30 days late'
                      : (m.escalationLevel ?? 0) > 0 && !settled
                        ? 'Late'
                        : null,
                    m.deliveredAt ? `Delivered ${formatDate(m.deliveredAt)}` : null,
                    m.confirmedAt ? `Confirmed ${formatDate(m.confirmedAt)}` : null,
                    verifiedBy
                      ? `Checked by ${verifiedBy.name}${verifiedBy.role ? `, ${verifiedBy.role}` : ''}${m.verifiedAt ? ` on ${formatDate(m.verifiedAt)}` : ''}`
                      : null,
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
              </>
            ),
            actions:
              canAct && m.status === 'DELIVERED' && contractOpen ? (
                <div className="space-y-2">
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
              ) : undefined,
          };
        })}
      />

      <ConfirmDialog
        open={Boolean(confirming)}
        onOpenChange={(open) => !open && setConfirming(null)}
        title={`Confirm “${confirming?.label ?? ''}”?`}
        description={
          showRelease && confirming && confirming.releaseBps > 0
            ? `Only confirm once you have it in hand. Confirming releases ${bpsToPercent(confirming.releaseBps)} of the price held by Sureground to the developer, and cannot be undone.`
            : 'Only confirm once you have it in hand. Confirming tells us the step is done and cannot be undone.'
        }
        confirmLabel="Confirm step"
        isLoading={Boolean(confirming) && pendingKey === confirming?.key}
        onConfirm={() =>
          confirming && onConfirm ? onConfirm(confirming.key).catch(() => undefined) : null
        }
      />
      <ReasonDialog
        open={Boolean(disputing)}
        onOpenChange={(open) => !open && setDisputing(null)}
        title={`Dispute “${disputing?.label ?? ''}”`}
        description={disputeDescription}
        reasonLabel="What is wrong?"
        reasonPlaceholder="e.g. The deed names the wrong plot number."
        reasonHint={(length) => `At least ${REASON_MIN} characters. ${length}/${REASON_MAX}`}
        minLength={REASON_MIN}
        maxLength={REASON_MAX}
        tone="danger"
        confirmLabel="Dispute step"
        // The caller reports the API's message.
        onSubmit={({ reason }) =>
          onDispute ? onDispute(disputing!.key, reason) : Promise.resolve()
        }
      />
    </>
  );
};
