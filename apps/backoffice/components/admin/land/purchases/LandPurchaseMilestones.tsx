'use client';

import { useState } from 'react';
import { Milestone } from 'lucide-react';
import { Badge, Button, ConfirmDialog } from '@getrentos/ui';
import { formatCurrency, formatDate } from '@getrentos/shared';
import type { LandEscrowRelease, LandMilestone } from '@/types/landPurchase';
import { bpsToPercent } from '@/lib/landDiligence';
import { LandCaseSection, PanelMessage } from '@/components/admin/land/case/shared';
import { LandLineStatusBadge } from './LandPurchaseStatusBadge';

const MIN_REASON = 5;

/**
 * Conveyance steps in sequence, each releasing a share of the price from
 * escrow. Waiving one (`verifications.approve`) counts it as satisfied for
 * sequence, escrow release and completion, so it is behind a confirmation.
 */
export const LandPurchaseMilestones = ({
  milestones,
  releases,
  canWaive,
  purchaseEnded,
  onWaive,
  isWaiving,
}: {
  milestones: LandMilestone[];
  releases: LandEscrowRelease[];
  canWaive: boolean;
  purchaseEnded: boolean;
  onWaive: (key: string, reason: string) => Promise<unknown>;
  isWaiving: boolean;
}) => {
  const [target, setTarget] = useState<LandMilestone | null>(null);
  const [reason, setReason] = useState('');
  const sorted = [...milestones].sort((a, b) => a.sequence - b.sequence);
  const releasedFor = (milestoneId: string) =>
    releases
      .filter((release) => release.milestoneId === milestoneId)
      .reduce((sum, release) => sum + release.amount, 0);

  return (
    <LandCaseSection title="Conveyance milestones" icon={Milestone}>
      {sorted.length === 0 ? (
        <PanelMessage>No conveyance milestones on this contract.</PanelMessage>
      ) : (
        <ol className="space-y-2.5">
          {sorted.map((milestone) => {
            const released = releasedFor(milestone.id);
            const waivable =
              canWaive &&
              !purchaseEnded &&
              milestone.status !== 'CONFIRMED' &&
              milestone.status !== 'WAIVED';
            return (
              <li key={milestone.id} className="rounded-xl border border-border p-3 text-sm">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="font-medium text-foreground">
                      {milestone.sequence}. {milestone.label}
                    </p>
                    <div className="mt-1 flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
                      {milestone.required && <Badge variant="warning">Required</Badge>}
                      <span>Releases {bpsToPercent(milestone.releaseBps)}</span>
                      {released > 0 && <span>· {formatCurrency(released)} released</span>}
                      {milestone.deliveredAt && (
                        <span>· delivered {formatDate(milestone.deliveredAt)}</span>
                      )}
                      {milestone.confirmedAt && (
                        <span>· confirmed {formatDate(milestone.confirmedAt)}</span>
                      )}
                    </div>
                    {milestone.note && (
                      <p className="mt-1 text-xs text-foreground">{milestone.note}</p>
                    )}
                    {milestone.disputeReason && (
                      <p className="mt-1 text-xs text-destructive">
                        Disputed: {milestone.disputeReason}
                      </p>
                    )}
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <LandLineStatusBadge status={milestone.status} />
                    {waivable && (
                      <Button variant="ghost" size="xs" onClick={() => setTarget(milestone)}>
                        Waive
                      </Button>
                    )}
                  </div>
                </div>
              </li>
            );
          })}
        </ol>
      )}

      <ConfirmDialog
        open={Boolean(target)}
        onOpenChange={(open) => {
          if (!open) {
            setTarget(null);
            setReason('');
          }
        }}
        title="Waive this milestone?"
        description={`"${target?.label ?? ''}" will count as satisfied: later steps may proceed and its ${bpsToPercent(
          target?.releaseBps ?? 0
        )} share can be released from escrow to the developer. This cannot be undone.`}
        confirmLabel="Waive milestone"
        promptLabel="Reason"
        promptPlaceholder="e.g. Survey already registered under the master title; no separate plan needed"
        promptValue={reason}
        onPromptChange={setReason}
        promptRequired
        promptMinLength={MIN_REASON}
        isLoading={isWaiving}
        onConfirm={async () => {
          if (target) await onWaive(target.key, reason).catch(() => undefined);
        }}
      />
    </LandCaseSection>
  );
};
