'use client';

import { useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { ChevronDown, ChevronUp, UserRoundPlus, UsersRound } from 'lucide-react';
import { Badge, Button, ConfirmDialog, ListSkeleton, type BadgeVariant } from '@getrentos/ui';
import { formatDate, unwrap } from '@getrentos/shared';
import { adminLandService } from '@/services/adminLandService';
import type { InviteLandReviewerInput, LandDiligenceCheck, LandReviewerSeat } from '@/types/land';
import { humaniseEnum, landQueryKeys } from '@/lib/landDiligence';
import { LandInviteReviewerDialog } from './LandInviteReviewerDialog';
import {
  LandCaseSection,
  PanelMessage,
  useInvalidateLandCase,
  type LandCasePanelProps,
} from './shared';

const seatVariant: Record<string, BadgeVariant> = {
  ACTIVE: 'info',
  COMPLETED: 'success',
  REVOKED: 'neutral',
};

/** Outside professionals seated on the case: who, on which checks, and their reports. */
export const LandReviewersPanel = ({
  propertyId,
  checks,
  canReview,
  canSearchUsers,
  onError,
  onSuccess,
}: Omit<LandCasePanelProps, 'canApprove'> & {
  checks: LandDiligenceCheck[];
  canSearchUsers: boolean;
}) => {
  const invalidate = useInvalidateLandCase();
  const [inviting, setInviting] = useState(false);
  const [revoking, setRevoking] = useState<LandReviewerSeat | null>(null);
  const [revokeReason, setRevokeReason] = useState('');
  const [openReport, setOpenReport] = useState<string | null>(null);

  const seats = useQuery({
    queryKey: landQueryKeys.caseSection(propertyId, 'reviewers'),
    queryFn: () => unwrap(adminLandService.listReviewers(propertyId)),
  });

  const invite = useMutation({
    mutationFn: (input: InviteLandReviewerInput) =>
      unwrap(adminLandService.inviteReviewer(propertyId, input)),
    onSuccess: (seat) => {
      invalidate();
      setInviting(false);
      onSuccess(`${seat.userName} has been invited as ${humaniseEnum(seat.role).toLowerCase()}.`);
    },
    onError: (error) => onError(error, 'Unable to invite that reviewer.'),
  });

  const revoke = useMutation({
    mutationFn: (seatId: string) =>
      unwrap(adminLandService.revokeReviewer(propertyId, seatId, revokeReason)),
    onSuccess: () => {
      invalidate();
      onSuccess('Reviewer seat withdrawn.');
    },
    onError: (error) => onError(error, 'Unable to revoke that seat.'),
  });

  const labelFor = (key: string) => checks.find((check) => check.key === key)?.label ?? key;
  const items = seats.data ?? [];

  return (
    <LandCaseSection
      title="Outside reviewers"
      icon={UsersRound}
      actions={
        canReview && (
          <Button
            variant="outline"
            size="xs"
            onClick={() => setInviting(true)}
            icon={<UserRoundPlus className="h-3.5 w-3.5" />}
          >
            Invite
          </Button>
        )
      }
    >
      {seats.isLoading ? (
        <ListSkeleton rows={2} label="Loading reviewers" />
      ) : seats.isError && !seats.data ? (
        <PanelMessage>
          {seats.error instanceof Error ? seats.error.message : 'Reviewers are unavailable.'}
        </PanelMessage>
      ) : items.length === 0 ? (
        <PanelMessage>No outside professional has been engaged on this case.</PanelMessage>
      ) : (
        <ul className="space-y-2.5">
          {items.map((seat) => (
            <li key={seat.id} className="rounded-xl border border-border p-3 text-sm">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="font-medium text-foreground">
                    {seat.userName}{' '}
                    <span className="font-normal text-muted-foreground">
                      · {humaniseEnum(seat.role)}
                    </span>
                  </p>
                  {seat.userEmail && (
                    <p className="text-xs text-muted-foreground">{seat.userEmail}</p>
                  )}
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    Invited by {seat.invitedByName} on {formatDate(seat.createdAt)}
                    {seat.dueAt && ` · due ${formatDate(seat.dueAt)}`}
                    {seat.completedAt && ` · reported ${formatDate(seat.completedAt)}`}
                    {seat.revokedAt && ` · revoked ${formatDate(seat.revokedAt)}`}
                  </p>
                  <div className="mt-1.5 flex flex-wrap gap-1">
                    {seat.checkKeys.map((key) => (
                      <Badge key={key} variant="neutral">
                        {labelFor(key)}
                      </Badge>
                    ))}
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <Badge variant={seatVariant[seat.status] ?? 'neutral'}>
                    {humaniseEnum(seat.status)}
                  </Badge>
                  {canReview && seat.status === 'ACTIVE' && (
                    <Button
                      variant="ghost"
                      size="xs"
                      className="text-destructive"
                      onClick={() => setRevoking(seat)}
                    >
                      Revoke
                    </Button>
                  )}
                </div>
              </div>
              {seat.report && (
                <div className="mt-2">
                  <Button
                    variant="ghost"
                    size="xs"
                    onClick={() => setOpenReport(openReport === seat.id ? null : seat.id)}
                    icon={
                      openReport === seat.id ? (
                        <ChevronUp className="h-3.5 w-3.5" />
                      ) : (
                        <ChevronDown className="h-3.5 w-3.5" />
                      )
                    }
                  >
                    {openReport === seat.id ? 'Hide report' : 'Show report'}
                  </Button>
                  {openReport === seat.id && (
                    <p className="mt-1.5 whitespace-pre-wrap rounded-lg bg-secondary/45 p-3 text-sm text-foreground">
                      {seat.report}
                    </p>
                  )}
                </div>
              )}
            </li>
          ))}
        </ul>
      )}

      {inviting && (
        <LandInviteReviewerDialog
          open
          onClose={() => setInviting(false)}
          checks={checks}
          canSearchUsers={canSearchUsers}
          isPending={invite.isPending}
          onSubmit={(input) => invite.mutate(input)}
        />
      )}

      <ConfirmDialog
        open={Boolean(revoking)}
        onOpenChange={(open) => {
          if (!open) {
            setRevoking(null);
            setRevokeReason('');
          }
        }}
        title="Withdraw this reviewer's seat?"
        description={`${revoking?.userName ?? 'The reviewer'} will lose access to this case immediately. Decisions they already recorded stay on the case.`}
        confirmLabel="Revoke seat"
        promptLabel="Reason (optional)"
        promptValue={revokeReason}
        onPromptChange={setRevokeReason}
        isLoading={revoke.isPending}
        onConfirm={async () => {
          if (revoking) await revoke.mutateAsync(revoking.id).catch(() => undefined);
        }}
      />
    </LandCaseSection>
  );
};
