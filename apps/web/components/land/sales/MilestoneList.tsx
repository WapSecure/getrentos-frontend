'use client';

import { Badge, Button } from '@getrentos/ui';
import { CheckCircle2, Circle, Clock3, FileCheck2, PackageCheck, XCircle } from 'lucide-react';
import { formatDate } from '@/lib/format';
import type { LandMilestone, LandMilestoneStatus } from '@/types/landDeveloper';
import { MILESTONE_STATUS } from '../developer/labels';
import { formatBps } from '../developer/planPricing';

const ICON: Record<LandMilestoneStatus, { icon: React.ElementType; className: string }> = {
  PENDING: { icon: Circle, className: 'text-muted-foreground' },
  DELIVERED: { icon: Clock3, className: 'text-info' },
  CONFIRMED: { icon: CheckCircle2, className: 'text-success' },
  DISPUTED: { icon: XCircle, className: 'text-destructive' },
  WAIVED: { icon: CheckCircle2, className: 'text-muted-foreground' },
};

export interface MilestoneDeliverability {
  allowed: boolean;
  /** Why not, shown under the step when delivery is blocked. */
  reason?: string;
}

interface MilestoneListProps {
  milestones: LandMilestone[];
  deliverability: (milestone: LandMilestone) => MilestoneDeliverability;
  onDeliver: (milestone: LandMilestone) => void;
  /** Show each step's share of the price released from escrow (developer sales). */
  showRelease?: boolean;
}

/**
 * The conveyance steps of a land sale. The seller marks a step delivered; the
 * buyer then confirms it (or disputes it), which is what releases escrow.
 */
export const MilestoneList = ({
  milestones,
  deliverability,
  onDeliver,
  showRelease = false,
}: MilestoneListProps) => {
  const ordered = [...milestones].sort((a, b) => a.sequence - b.sequence);
  return (
    <ol className="space-y-3">
      {ordered.map((milestone) => {
        const { icon: Icon, className } = ICON[milestone.status] ?? ICON.PENDING;
        const status = MILESTONE_STATUS[milestone.status] ?? MILESTONE_STATUS.PENDING;
        const canDeliverNow = milestone.status === 'PENDING' || milestone.status === 'DISPUTED';
        const { allowed, reason } = canDeliverNow
          ? deliverability(milestone)
          : { allowed: false, reason: undefined };
        return (
          <li
            key={milestone.key}
            className="flex flex-col gap-3 rounded-xl border border-border bg-card p-4 sm:flex-row sm:items-start sm:justify-between"
          >
            <div className="flex min-w-0 gap-3">
              <Icon className={`mt-0.5 h-5 w-5 shrink-0 ${className}`} aria-hidden="true" />
              <div className="min-w-0">
                <p className="font-medium text-foreground">
                  {milestone.label}
                  {!milestone.required && (
                    <span className="font-normal text-muted-foreground"> (optional)</span>
                  )}
                </p>
                <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                  <Badge variant={status.variant}>{status.label}</Badge>
                  {showRelease && milestone.releaseBps > 0 && (
                    <span>Releases {formatBps(milestone.releaseBps)} of the price</span>
                  )}
                  {milestone.deliveredAt && (
                    <span>Delivered {formatDate(milestone.deliveredAt)}</span>
                  )}
                  {milestone.confirmedAt && (
                    <span>Confirmed {formatDate(milestone.confirmedAt)}</span>
                  )}
                  {milestone.documentId && (
                    <span className="inline-flex items-center gap-1">
                      <FileCheck2 className="h-3.5 w-3.5" aria-hidden="true" />
                      Document attached
                    </span>
                  )}
                </div>
                {milestone.note && (
                  <p className="mt-2 whitespace-pre-line text-sm text-muted-foreground">
                    {milestone.note}
                  </p>
                )}
                {milestone.status === 'DISPUTED' && milestone.disputeReason && (
                  <p className="mt-2 rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-foreground">
                    <span className="font-medium">Buyer disputed:</span> {milestone.disputeReason}
                  </p>
                )}
                {canDeliverNow && !allowed && reason && (
                  <p className="mt-2 text-xs text-muted-foreground">{reason}</p>
                )}
              </div>
            </div>
            {canDeliverNow && (
              <Button
                variant={milestone.status === 'DISPUTED' ? 'outline' : 'primary'}
                size="sm"
                rounded="lg"
                disabled={!allowed}
                onClick={() => onDeliver(milestone)}
                icon={<PackageCheck className="h-4 w-4" />}
                className="shrink-0 self-start"
              >
                {milestone.status === 'DISPUTED' ? 'Deliver again' : 'Mark delivered'}
              </Button>
            )}
          </li>
        );
      })}
    </ol>
  );
};
