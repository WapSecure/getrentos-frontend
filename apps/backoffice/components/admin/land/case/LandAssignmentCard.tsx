'use client';

import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { AlarmClock, UserCheck, UserRoundPlus } from 'lucide-react';
import { Button } from '@getrentos/ui';
import { formatDate, unwrap } from '@getrentos/shared';
import { adminLandService } from '@/services/adminLandService';
import type { AdminLandDiligenceDetail } from '@/types/land';
import { describeSla } from '@/lib/landDiligence';
import { LandCaseSection, useInvalidateLandCase, type LandCasePanelProps } from './shared';
import { UserLookup, type PickedUser } from './UserLookup';

/** Who holds the case, when it is owed, and claiming or handing it over. */
export const LandAssignmentCard = ({
  detail,
  canReview,
  canSearchUsers,
  onError,
  onSuccess,
}: Omit<LandCasePanelProps, 'canApprove'> & {
  detail: AdminLandDiligenceDetail;
  canSearchUsers: boolean;
}) => {
  const { propertyId, diligence } = detail;
  const invalidate = useInvalidateLandCase();
  const [handingOver, setHandingOver] = useState(false);
  const [assignee, setAssignee] = useState<PickedUser | null>(null);
  const sla = describeSla(diligence.slaDueAt, diligence.overdue);

  const assign = useMutation({
    mutationFn: (assigneeId?: string) =>
      unwrap(adminLandService.assignDiligence(propertyId, assigneeId)),
    onSuccess: (_result, assigneeId) => {
      invalidate();
      setHandingOver(false);
      setAssignee(null);
      onSuccess(assigneeId ? 'Case assigned. They have been notified.' : 'Case assigned to you.');
    },
    onError: (error) => onError(error, 'Unable to assign this case.'),
  });

  return (
    <LandCaseSection title="Assignment & SLA" icon={UserCheck}>
      <dl className="space-y-2 text-sm">
        <div className="flex justify-between gap-3">
          <dt className="text-muted-foreground">Assigned to</dt>
          <dd className="text-right font-medium text-foreground">
            {diligence.assignedToName ?? 'Unassigned'}
          </dd>
        </div>
        <div className="flex justify-between gap-3">
          <dt className="flex items-center gap-1 text-muted-foreground">
            <AlarmClock className="h-3.5 w-3.5" /> Review owed
          </dt>
          <dd
            className={`text-right ${
              sla.tone === 'overdue'
                ? 'font-semibold text-destructive'
                : sla.tone === 'soon'
                  ? 'text-warning'
                  : 'text-foreground'
            }`}
          >
            {diligence.slaDueAt ? `${formatDate(diligence.slaDueAt)} · ${sla.label}` : 'No clock'}
          </dd>
        </div>
      </dl>

      {canReview && (
        <div className="mt-4 space-y-3 border-t border-border pt-4">
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => assign.mutate(undefined)}
              isLoading={assign.isPending && !assign.variables}
              disabled={assign.isPending}
              icon={<UserCheck className="h-4 w-4" />}
            >
              Assign to me
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setHandingOver((open) => !open)}
              disabled={assign.isPending}
              icon={<UserRoundPlus className="h-4 w-4" />}
            >
              Assign to staff…
            </Button>
          </div>
          {handingOver && (
            <div className="space-y-2">
              <UserLookup
                value={assignee}
                onChange={setAssignee}
                staffOnly
                canSearch={canSearchUsers}
                ariaLabel="Find a staff member to assign"
              />
              <div className="flex justify-end">
                <Button
                  variant="primary"
                  size="sm"
                  disabled={!assignee || assign.isPending}
                  isLoading={assign.isPending && Boolean(assign.variables)}
                  onClick={() => assignee && assign.mutate(assignee.id)}
                >
                  Assign
                </Button>
              </div>
            </div>
          )}
        </div>
      )}
    </LandCaseSection>
  );
};
