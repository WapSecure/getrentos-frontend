'use client';

import { CircleCheck, OctagonAlert, RefreshCw, UsersRound } from 'lucide-react';
import { Alert, Button } from '@getrentos/ui';
import type { AdminLandDiligenceDetail } from '@/types/land';

/** Shown when the API refused a change because the case moved on (409). */
export const LandStaleCaseBanner = ({
  onReload,
  isReloading,
}: {
  onReload: () => void;
  isReloading: boolean;
}) => (
  <Alert
    variant="danger"
    icon={OctagonAlert}
    title="This case changed since you loaded it"
    action={
      <Button
        variant="danger"
        size="sm"
        onClick={onReload}
        isLoading={isReloading}
        icon={<RefreshCw className="h-4 w-4" />}
      >
        Reload case
      </Button>
    }
  >
    Another reviewer recorded something first. Reload to see the case as it stands now and review
    it again before deciding.
  </Alert>
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
          <Alert
            variant="warning"
            icon={OctagonAlert}
            title={`Approval is blocked (${blockers.length})`}
          >
            <ul className="list-disc space-y-0.5 pl-4 text-foreground">
              {blockers.map((blocker) => (
                <li key={blocker}>{blocker}</li>
              ))}
            </ul>
          </Alert>
        ) : (
          <Alert variant="success" icon={CircleCheck}>
            Nothing blocks approval: required checks are passed with evidence, there are no open
            conflicts or active encumbrances, and ownership is verified.
          </Alert>
        ))}

      {detail.requiresDualApproval && !decided && (
        <Alert
          variant="info"
          icon={UsersRound}
          title={
            awaitingSecond
              ? 'Awaiting second approval by a different reviewer'
              : 'Dual control applies to this parcel'
          }
        >
          {awaitingSecond ? (
            <>
              First approved by {firstApprover ?? 'another reviewer'}.{' '}
              {iGaveFirst
                ? 'You gave the first approval, so someone else must give the second.'
                : 'Any change to a check voids the first approval.'}
            </>
          ) : (
            'It is high value, so approval needs two different reviewers. The first approval is recorded; a second reviewer then verifies it.'
          )}
        </Alert>
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
