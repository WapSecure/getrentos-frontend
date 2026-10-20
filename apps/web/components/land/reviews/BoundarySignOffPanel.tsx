'use client';

import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { ShieldCheck, Undo2 } from 'lucide-react';
import { Alert, Button, Field, Textarea, useToast } from '@getrentos/ui';
import {
  BOUNDARY_SOURCE_LABEL,
  boundaryCorners,
  type LandBoundaryVersion,
} from '@getrentos/shared';
import { ParcelBoundaryMap, formatArea } from '@/components/maps/ParcelBoundaryMap';
import { SignOffBadge } from '@/components/land/boundary/BoundaryHistory';
import { unwrap } from '@/lib/apiHelpers';
import { landReviewerService } from '@/services/landReviewerService';
import type { LandReviewCase } from '@/types/landReviewer';

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric' });

const MIN_REASON = 10;

/**
 * The surveyor on a case compares the parcel's outline with the survey plan
 * and signs off the version they checked, or returns it with what is wrong.
 * Survey-plan outlines show the beacons in the plan's own grid so they can be
 * read against the plan line by line.
 */
export function BoundarySignOffPanel({
  seatId,
  versions,
  canDecide,
  onUpdated,
}: {
  seatId: string;
  versions: LandBoundaryVersion[];
  /** False until the seat is active and the conflict declaration is made. */
  canDecide: boolean;
  onUpdated: (next: LandReviewCase) => void;
}) {
  const toast = useToast();
  const [returning, setReturning] = useState(false);
  const [reason, setReason] = useState('');
  const current = versions.find((v) => v.current) ?? null;
  const earlier = versions.filter((v) => !v.current);
  const corners = current ? boundaryCorners(current.geometry) : null;

  const decide = useMutation({
    mutationFn: (input: { decision: 'SIGNED_OFF' | 'REJECTED'; note?: string }) =>
      unwrap(landReviewerService.signOffBoundary(seatId, current!.id, input)),
    onSuccess: (next, input) => {
      onUpdated(next);
      setReturning(false);
      setReason('');
      toast.success(
        input.decision === 'SIGNED_OFF'
          ? `Version ${current?.version} signed off. The owner has been told.`
          : 'Returned to the owner with your reason.'
      );
    },
  });

  if (!current) {
    return (
      <section className="rounded-2xl border border-border bg-card p-5">
        <h2 className="text-base font-semibold text-foreground">Boundary</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          The owner has not outlined the plot yet. There is nothing to sign off.
        </p>
      </section>
    );
  }

  const decided = current.signOff.status !== 'UNREVIEWED';

  return (
    <section className="space-y-4 rounded-2xl border border-border bg-card p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold text-foreground">
            Boundary, version {current.version}
          </h2>
          <p className="mt-0.5 text-sm text-muted-foreground">
            {BOUNDARY_SOURCE_LABEL[current.source]}
            {current.source === 'SURVEY_COORDINATES' &&
              `, ${current.coordinateSystem.label}`} · {formatArea(current.areaSqm)} · saved{' '}
            {formatDate(current.createdAt)}
          </p>
        </div>
        <SignOffBadge signOff={current.signOff} />
      </div>

      {corners && <ParcelBoundaryMap corners={corners} height={240} />}

      {current.sourceCoordinates && current.sourceCoordinates.length > 0 && (
        <div className="overflow-x-auto rounded-lg border border-border">
          <table className="w-full text-sm tabular-nums">
            <caption className="sr-only">
              Beacons as entered from the survey plan, in {current.coordinateSystem.label}
            </caption>
            <thead className="bg-secondary/50 text-left text-xs text-muted-foreground">
              <tr>
                <th scope="col" className="px-3 py-2 font-medium">
                  #
                </th>
                <th scope="col" className="px-3 py-2 font-medium">
                  Easting (m)
                </th>
                <th scope="col" className="px-3 py-2 font-medium">
                  Northing (m)
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {current.sourceCoordinates.map(([x, y], index) => (
                <tr key={index}>
                  <td className="px-3 py-1.5 text-muted-foreground">{index + 1}</td>
                  <td className="px-3 py-1.5 text-foreground">{x.toFixed(2)}</td>
                  <td className="px-3 py-1.5 text-foreground">{y.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {decided ? (
        <Alert variant={current.signOff.status === 'SIGNED_OFF' ? 'success' : 'warning'}>
          {current.signOff.status === 'SIGNED_OFF'
            ? `You signed off this version on ${formatDate(current.signOff.at!)}.`
            : `You returned this version: “${current.signOff.note}”. A corrected outline will appear here as a new version.`}
        </Alert>
      ) : !canDecide ? (
        <p className="text-sm text-muted-foreground">
          Declare whether you have a conflict of interest to sign off the boundary.
        </p>
      ) : returning ? (
        <div className="space-y-3">
          <Field
            label="What is wrong with the outline?"
            hint="The owner sees this. Name the beacons and how far off they are."
            error={
              reason.trim().length > 0 && reason.trim().length < MIN_REASON
                ? `At least ${MIN_REASON} characters`
                : undefined
            }
            required
          >
            <Textarea
              rows={3}
              maxLength={1000}
              showCount
              value={reason}
              onChange={(event) => setReason(event.target.value)}
              placeholder="Beacon PB 1234 is about 4 m east of the plan; the north side should follow the drainage."
            />
          </Field>
          <div className="flex flex-wrap justify-end gap-2">
            <Button variant="ghost" onClick={() => setReturning(false)} disabled={decide.isPending}>
              Cancel
            </Button>
            <Button
              variant="danger"
              onClick={() => decide.mutate({ decision: 'REJECTED', note: reason })}
              disabled={reason.trim().length < MIN_REASON}
              isLoading={decide.isPending}
            >
              Return to owner
            </Button>
          </div>
        </div>
      ) : (
        <div className="flex flex-wrap justify-end gap-2">
          <Button
            variant="outline"
            icon={<Undo2 className="h-4 w-4" />}
            onClick={() => setReturning(true)}
            disabled={decide.isPending}
          >
            Return with a reason
          </Button>
          <Button
            icon={<ShieldCheck className="h-4 w-4" />}
            onClick={() => decide.mutate({ decision: 'SIGNED_OFF' })}
            isLoading={decide.isPending}
          >
            Sign off version {current.version}
          </Button>
        </div>
      )}

      {earlier.length > 0 && (
        <details className="group text-sm">
          <summary className="cursor-pointer select-none text-muted-foreground hover:text-foreground">
            {earlier.length} earlier {earlier.length === 1 ? 'version' : 'versions'}
          </summary>
          <ul className="mt-2 space-y-1.5">
            {earlier.map((v) => (
              <li key={v.id} className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-foreground">
                  Version {v.version} · {formatArea(v.areaSqm)} · {formatDate(v.createdAt)}
                </span>
                <SignOffBadge signOff={v.signOff} />
              </li>
            ))}
          </ul>
        </details>
      )}
    </section>
  );
}
