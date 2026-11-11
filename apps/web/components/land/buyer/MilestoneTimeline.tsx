'use client';

import { useState } from 'react';
import {
  Button,
  ConfirmDialog,
  EmptyState,
  ReasonDialog,
  Timeline,
  type TimelineState,
} from '@sureground/ui';
import { ListChecks } from '@sureground/icons';
import { formatDate } from '@/lib/format';
import type { LandMilestone } from '@/types/landBuyer';
import { MilestoneStatusBadge } from './LandSaleBadges';
import { bpsToPercent, milestoneAction } from './landSaleLogic';

const REASON_MIN = 5;
const REASON_MAX = 2000;

const STATE: Record<LandMilestone['status'], TimelineState> = {
  PENDING: 'pending',
  DELIVERED: 'current',
  CONFIRMED: 'done',
  DISPUTED: 'blocked',
  WAIVED: 'skipped',
};

// Developer purchases release a share of escrow per confirmation; resales release once every required step is confirmed.
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
  contractOpen: boolean;
  /** Resales only block on earlier required steps. */
  requiredOnly?: boolean;
  showRelease?: boolean;
  onConfirm: (key: string) => Promise<unknown>;
  onDispute: (key: string, reason: string) => Promise<unknown>;
  pendingKey?: string | null;
}) => {
  const [confirming, setConfirming] = useState<LandMilestone | null>(null);
  const [disputing, setDisputing] = useState<LandMilestone | null>(null);
  const ordered = [...milestones].sort((a, b) => a.sequence - b.sequence);

  if (ordered.length === 0) {
    return (
      <EmptyState
        icon={ListChecks}
        title="No conveyance steps yet"
        description="The steps to transfer this land, and their progress, will appear here once set up."
        size="compact"
        bare
      />
    );
  }

  return (
    <>
      <Timeline
        titleAs="h3"
        aria-label="Conveyance steps"
        items={ordered.map((m) => {
          const action = milestoneAction(ordered, m, { requiredOnly, contractOpen });
          return {
            id: m.key,
            title: m.label,
            state: STATE[m.status],
            badge: (
              <>
                <MilestoneStatusBadge status={m.status} />
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
              </>
            ),
            actions:
              m.status === 'DELIVERED' && contractOpen ? (
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
        onConfirm={() => (confirming ? onConfirm(confirming.key).catch(() => undefined) : null)}
      />
      <ReasonDialog
        open={Boolean(disputing)}
        onOpenChange={(open) => !open && setDisputing(null)}
        title={`Dispute “${disputing?.label ?? ''}”`}
        description="Tell the seller what is wrong with this step. No money is released for it while it is disputed; they will deliver it again."
        reasonLabel="What is wrong?"
        reasonPlaceholder="e.g. The deed names the wrong plot number."
        reasonHint={(length) => `At least ${REASON_MIN} characters. ${length}/${REASON_MAX}`}
        minLength={REASON_MIN}
        maxLength={REASON_MAX}
        tone="danger"
        confirmLabel="Dispute step"
        // The caller reports the API's message.
        onSubmit={({ reason }) => onDispute(disputing!.key, reason)}
      />
    </>
  );
};
