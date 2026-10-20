'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { History, ShieldCheck, ShieldAlert, ShieldQuestion } from 'lucide-react';
import {
  Badge,
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
  EmptyState,
  ListSkeleton,
  PageErrorState,
} from '@getrentos/ui';
import {
  BOUNDARY_SOURCE_LABEL,
  boundarySignOffText,
  type LandBoundarySignOff,
  type LandBoundaryStatus,
  type LandBoundaryVersion,
} from '@getrentos/shared';
import { formatArea } from '@/components/maps/ParcelBoundaryMap';
import { landKeys } from '@/lib/queryKeys';
import { unwrap } from '@/lib/apiHelpers';
import { landService } from '@/services/landService';

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric' });

export function SignOffBadge({ signOff }: { signOff: Pick<LandBoundarySignOff, 'status'> }) {
  if (signOff.status === 'SIGNED_OFF') {
    return (
      <Badge variant="success" icon={<ShieldCheck className="h-3.5 w-3.5" aria-hidden="true" />}>
        Surveyor signed off
      </Badge>
    );
  }
  if (signOff.status === 'REJECTED') {
    return (
      <Badge variant="danger" icon={<ShieldAlert className="h-3.5 w-3.5" aria-hidden="true" />}>
        Needs correcting
      </Badge>
    );
  }
  return (
    <Badge variant="neutral" icon={<ShieldQuestion className="h-3.5 w-3.5" aria-hidden="true" />}>
      Not yet checked
    </Badge>
  );
}

function VersionRow({ version }: { version: LandBoundaryVersion }) {
  return (
    <li className="space-y-2 py-4 first:pt-0 last:pb-0">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm font-semibold text-foreground">
          Version {version.version}
          {version.current && (
            <span className="ml-2 text-xs font-medium text-primary">Current</span>
          )}
        </p>
        <SignOffBadge signOff={version.signOff} />
      </div>
      <dl className="grid grid-cols-1 gap-x-6 gap-y-1 text-sm sm:grid-cols-2">
        <div className="flex gap-2">
          <dt className="text-muted-foreground">Saved</dt>
          <dd className="text-foreground">{formatDate(version.createdAt)}</dd>
        </div>
        <div className="flex gap-2">
          <dt className="text-muted-foreground">Area</dt>
          <dd className="tabular-nums text-foreground">{formatArea(version.areaSqm)}</dd>
        </div>
        <div className="flex gap-2 sm:col-span-2">
          <dt className="text-muted-foreground">From</dt>
          <dd className="text-foreground">
            {BOUNDARY_SOURCE_LABEL[version.source]}
            {version.source === 'SURVEY_COORDINATES' && ` (${version.coordinateSystem.label})`}
          </dd>
        </div>
      </dl>
      {version.signOff.status !== 'UNREVIEWED' && (
        <p className="text-sm text-muted-foreground">
          {version.signOff.status === 'SIGNED_OFF' ? 'Signed off' : 'Returned'}
          {version.signOff.by ? ` by ${version.signOff.by}` : ''}
          {version.signOff.at ? ` on ${formatDate(version.signOff.at)}` : ''}
          {version.signOff.note ? `: “${version.signOff.note}”` : '.'}
        </p>
      )}
    </li>
  );
}

/**
 * Where the outline stands with the case's surveyor, and every outline the
 * parcel has had. A redraw starts a new version that needs its own check.
 */
export function BoundaryHistory({
  propertyId,
  status,
}: {
  propertyId: string;
  status: LandBoundaryStatus | null;
}) {
  const [open, setOpen] = useState(false);
  const versions = useQuery({
    queryKey: [...landKeys.ownerDetail(propertyId), 'boundary-versions', status?.version ?? 0],
    queryFn: () => unwrap(landService.boundaryVersions(propertyId)),
    enabled: open,
  });

  if (!status) return null;

  return (
    <div className="mt-3 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border bg-secondary/40 px-3 py-2.5">
      <div className="flex min-w-0 flex-wrap items-center gap-2">
        <SignOffBadge signOff={status.signOff} />
        <span className="text-sm text-muted-foreground">
          Version {status.version}. {boundarySignOffText(status.signOff)}.
        </span>
      </div>
      <Button
        variant="ghost"
        size="sm"
        icon={<History className="h-4 w-4" />}
        onClick={() => setOpen(true)}
      >
        History
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent size="lg">
          <DialogTitle className="text-lg font-semibold text-foreground">
            Outline history
          </DialogTitle>
          <DialogDescription className="mt-1 text-sm text-muted-foreground">
            Every outline this parcel has had. A surveyor’s sign-off covers one version; redrawing
            the outline starts a new one that needs checking again.
          </DialogDescription>
          <div className="mt-5">
            {versions.isLoading ? (
              <ListSkeleton rows={2} bare />
            ) : versions.isError && !versions.data ? (
              <PageErrorState
                headingLevel="h2"
                title="The history did not load"
                onRetry={() => versions.refetch()}
                isRetrying={versions.isFetching}
                className="min-h-0 border-0 py-6"
              />
            ) : versions.data && versions.data.length > 0 ? (
              <ul className="divide-y divide-border">
                {versions.data.map((version) => (
                  <VersionRow key={version.id} version={version} />
                ))}
              </ul>
            ) : (
              <EmptyState icon={History} title="No outline saved yet" size="compact" bare />
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
