'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Gauge, RefreshCw } from 'lucide-react';
import { Badge, Button } from '@getrentos/ui';
import { unwrap } from '@getrentos/shared';
import { adminLandService } from '@/services/adminLandService';
import { humaniseEnum, landQueryKeys, riskBadgeVariant } from '@/lib/landDiligence';
import {
  LandCaseSection,
  PanelMessage,
  useInvalidateLandCase,
  type LandCasePanelProps,
} from './shared';

/**
 * The live risk breakdown, beside what is stored on the case. Refresh
 * recomputes and stores it, which is what the queue and buyers see.
 */
export const LandRiskPanel = ({
  propertyId,
  canReview,
  onError,
  onSuccess,
}: Omit<LandCasePanelProps, 'canApprove'>) => {
  const queryClient = useQueryClient();
  const invalidate = useInvalidateLandCase();
  const key = landQueryKeys.caseSection(propertyId, 'risk');
  const risk = useQuery({
    queryKey: key,
    queryFn: () => unwrap(adminLandService.getRisk(propertyId)),
  });

  const refresh = useMutation({
    mutationFn: () => unwrap(adminLandService.refreshRisk(propertyId)),
    onSuccess: (assessment) => {
      queryClient.setQueryData(key, assessment);
      invalidate();
      onSuccess('Risk score recomputed and stored on the case.');
    },
    onError: (error) => onError(error, 'Unable to refresh the risk score.'),
  });

  const data = risk.data;
  const lagging =
    data &&
    (data.stored.riskScore !== data.score || data.stored.assuranceTier !== data.assuranceTier);

  return (
    <LandCaseSection
      title="Risk"
      icon={Gauge}
      actions={
        canReview && (
          <Button
            variant="ghost"
            size="xs"
            onClick={() => refresh.mutate()}
            isLoading={refresh.isPending}
            icon={<RefreshCw className="h-3.5 w-3.5" />}
          >
            Refresh
          </Button>
        )
      }
    >
      {risk.isLoading ? (
        <PanelMessage>Loading the risk breakdown…</PanelMessage>
      ) : risk.isError || !data ? (
        <PanelMessage>
          {risk.error instanceof Error ? risk.error.message : 'The risk breakdown is unavailable.'}
        </PanelMessage>
      ) : (
        <div className="space-y-3 text-sm">
          <div className="flex flex-wrap items-center gap-2">
            <span className="type-title text-2xl">{data.score}</span>
            <span className="text-muted-foreground">/ 100</span>
            <Badge variant={riskBadgeVariant(data.band)}>{humaniseEnum(data.band)} risk</Badge>
            {data.assuranceTier && (
              <Badge variant="info">{humaniseEnum(data.assuranceTier)} assurance</Badge>
            )}
          </div>
          {lagging && (
            <p className="text-xs text-warning">
              Stored on the case: {data.stored.riskScore ?? 'none'}
              {data.stored.assuranceTier ? ` · ${humaniseEnum(data.stored.assuranceTier)}` : ''}.
              Refresh to store the live figure.
            </p>
          )}
          {data.factors.length > 0 ? (
            <ul className="divide-y divide-border rounded-xl border border-border">
              {data.factors.map((factor) => (
                <li key={factor.factor} className="flex justify-between gap-3 px-3 py-2">
                  <span className="text-foreground">{factor.factor}</span>
                  <span
                    className={`shrink-0 font-mono ${
                      factor.points > 0 ? 'text-destructive' : 'text-success'
                    }`}
                  >
                    {factor.points > 0 ? `+${factor.points}` : factor.points}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <PanelMessage>No risk factors apply.</PanelMessage>
          )}
          <p className="text-xs text-muted-foreground">
            Checks {data.inputs.checks.passed}/{data.inputs.checks.total} passed ·{' '}
            {data.inputs.checks.flagged} flagged · {data.inputs.openConflicts} open conflicts ·{' '}
            {data.inputs.activeEncumbrances} active encumbrances ·{' '}
            {data.inputs.completedExternalReviews} external reviews ·{' '}
            {data.inputs.hasBoundary ? 'boundary surveyed' : 'no boundary'}
          </p>
        </div>
      )}
    </LandCaseSection>
  );
};
