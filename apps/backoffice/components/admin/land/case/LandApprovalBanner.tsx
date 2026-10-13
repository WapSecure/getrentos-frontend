'use client';

import { CircleCheck, OctagonAlert, RefreshCw, UsersRound } from 'lucide-react';
import { Button } from '@getrentos/ui';
import type { AdminLandDiligenceDetail } from '@/types/land';

/** Shown when the API refused a change because the case moved on (409). */
export const LandStaleCaseBanner = ({
  onReload,
  isReloading,
}: {
  onReload: () => void;
  isReloading: boolean;
}) => (
  <div
    role="alert"
    className="flex flex-col gap-3 rounded-2xl border border-destructive/40 bg-destructive/5 p-4 sm:flex-row sm:items-center sm:justify-between"
  >
    <div className="flex gap-3">
      <OctagonAlert className="mt-0.5 h-5 w-5 shrink-0 text-destructive" />
      <div className="text-sm">
        <p className="font-semibold text-foreground">This case changed since you loaded it</p>
        <p className="mt-0.5 text-muted-foreground">
          Another reviewer recorded something first. Reload to see the case as it stands now and
          review it again before deciding.
        </p>
      </div>
    </div>
    <Button
      variant="danger"
      size="sm"
      onClick={onReload}
      isLoading={isReloading}
      icon={<RefreshCw className="h-4 w-4" />}
    >
      Reload case
    </Button>
  </div>
);

/**
 * Why the case cannot be approved yet, and where dual control stands. The
 * blockers come from the API itself, so the screen never second-guesses them.
 */
export const LandApprovalBanner = ({
  detail,
  currentUserName,
}: {
  detail: AdminLandDiligenceDetail;
  currentUserName?: string;
}) => {
  const blockers = detail.approvalBlockers ?? [];
  const { diligence } = detail;
  const awaitingSecond = Boolean(diligence.awaitingSecondApproval);
  const firstApprover = diligence.firstApprovedByName;
  const iGaveFirst = gaveFirstApproval(detail, currentUserName);
  const decided = ['VERIFIED', 'REJECTED', 'EXPIRED'].includes(String(diligence.status));

  return (
    <div className="space-y-3">
      {!decided &&
        (blockers.length > 0 ? (
          <div className="rounded-2xl border border-warning/40 bg-warning-subtle p-4">
            <div className="flex gap-3">
              <OctagonAlert className="mt-0.5 h-5 w-5 shrink-0 text-warning" />
              <div className="min-w-0 text-sm">
                <p className="font-semibold text-foreground">
                  Approval is blocked ({blockers.length})
                </p>
                <ul className="mt-1.5 list-disc space-y-0.5 pl-4 text-foreground">
                  {blockers.map((blocker) => (
                    <li key={blocker}>{blocker}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex gap-3 rounded-2xl border border-success/30 bg-success-subtle p-4 text-sm">
            <CircleCheck className="mt-0.5 h-5 w-5 shrink-0 text-success" />
            <p className="text-foreground">
              Nothing blocks approval: required checks are passed with evidence, there are no open
              conflicts or active encumbrances, and ownership is verified.
            </p>
          </div>
        ))}

      {detail.requiresDualApproval && !decided && (
        <div className="flex gap-3 rounded-2xl border border-primary/25 bg-accent/50 p-4 text-sm">
          <UsersRound className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
          <div className="text-foreground">
            {awaitingSecond ? (
              <>
                <p className="font-semibold">Awaiting second approval by a different reviewer</p>
                <p className="mt-0.5 text-muted-foreground">
                  First approved by {firstApprover ?? 'another reviewer'}.{' '}
                  {iGaveFirst
                    ? 'You gave the first approval, so someone else must give the second.'
                    : 'Any change to a check voids the first approval.'}
                </p>
              </>
            ) : (
              <>
                <p className="font-semibold">Dual control applies to this parcel</p>
                <p className="mt-0.5 text-muted-foreground">
                  It is high value, so approval needs two different reviewers. The first approval is
                  recorded; a second reviewer then verifies it.
                </p>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

/** True when the signed-in reviewer appears to have given the first of two approvals. */
export const gaveFirstApproval = (detail: AdminLandDiligenceDetail, currentUserName?: string) =>
  Boolean(
    detail.diligence.awaitingSecondApproval &&
    detail.diligence.firstApprovedByName &&
    currentUserName &&
    detail.diligence.firstApprovedByName.trim().toLowerCase() ===
      currentUserName.trim().toLowerCase()
  );
