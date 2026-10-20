'use client';

import { useQuery } from '@tanstack/react-query';
import { Map as MapIcon } from 'lucide-react';
import { Badge, ListSkeleton, type BadgeVariant } from '@getrentos/ui';
import {
  BOUNDARY_SOURCE_LABEL,
  formatDate,
  unwrap,
  type LandBoundarySignOffStatus,
} from '@getrentos/shared';
import { adminLandService } from '@/services/adminLandService';
import { landQueryKeys } from '@/lib/landDiligence';
import { LandCaseSection, PanelMessage, type LandCasePanelProps } from './shared';

const signOffBadge: Record<LandBoundarySignOffStatus, { variant: BadgeVariant; label: string }> = {
  UNREVIEWED: { variant: 'neutral', label: 'Not checked by a surveyor' },
  SIGNED_OFF: { variant: 'success', label: 'Surveyor signed off' },
  REJECTED: { variant: 'danger', label: 'Surveyor returned it' },
};

const sqm = (value: number) => `${Math.round(value).toLocaleString('en-NG')} m²`;

/**
 * The parcel's outline history: every redraw, what it was entered from
 * (map or survey-plan coordinates, and in which grid) and what the case's
 * surveyor said about each version.
 */
export const LandBoundaryVersionsPanel = ({
  propertyId,
}: Pick<LandCasePanelProps, 'propertyId'>) => {
  const versions = useQuery({
    queryKey: landQueryKeys.caseSection(propertyId, 'boundary-versions'),
    queryFn: () => unwrap(adminLandService.listBoundaryVersions(propertyId)),
  });

  return (
    <LandCaseSection
      title="Boundary versions"
      icon={MapIcon}
      description="A surveyor's sign-off covers one version. A redraw starts a new one."
    >
      {versions.isLoading ? (
        <ListSkeleton rows={2} bare />
      ) : versions.isError && !versions.data ? (
        <PanelMessage>
          The boundary history did not load. Reload the case to try again.
        </PanelMessage>
      ) : !versions.data || versions.data.length === 0 ? (
        <PanelMessage>The owner has not outlined the plot yet.</PanelMessage>
      ) : (
        <ul className="space-y-3">
          {versions.data.map((version) => {
            const badge = signOffBadge[version.signOff.status];
            return (
              <li key={version.id} className="rounded-xl border border-border p-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-sm font-semibold text-foreground">
                    Version {version.version}
                    {version.current && (
                      <span className="ml-2 text-xs font-medium text-primary">Current</span>
                    )}
                  </p>
                  <Badge variant={badge.variant}>{badge.label}</Badge>
                </div>
                <p className="mt-1 text-sm text-muted-foreground">
                  {BOUNDARY_SOURCE_LABEL[version.source]}
                  {version.source === 'SURVEY_COORDINATES' &&
                    ` (${version.coordinateSystem.label})`}{' '}
                  · {sqm(version.areaSqm)} · {formatDate(version.createdAt)}
                  {version.surveyNumber ? ` · survey ${version.surveyNumber}` : ''}
                </p>
                {version.signOff.status !== 'UNREVIEWED' && (
                  <p className="mt-1 text-sm text-foreground">
                    {version.signOff.by ?? 'The surveyor'}
                    {version.signOff.at ? `, ${formatDate(version.signOff.at)}` : ''}
                    {version.signOff.note ? `: “${version.signOff.note}”` : ''}
                  </p>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </LandCaseSection>
  );
};
