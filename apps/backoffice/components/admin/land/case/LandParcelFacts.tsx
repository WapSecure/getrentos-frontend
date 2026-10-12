'use client';

import { Lock, Ruler } from 'lucide-react';
import { formatCurrency, formatDate } from '@getrentos/shared';
import type { AdminLandDiligenceDetail } from '@/types/land';
import { humaniseEnum } from '@/lib/landDiligence';
import { Fact, LandCaseSection } from './shared';

const notSupplied = 'Not supplied';
const yesNo = (value: boolean | null | undefined) =>
  value === null || value === undefined ? notSupplied : value ? 'Yes' : 'No';

/**
 * The parcel as staff see it. Title number, survey number and registry are
 * private to the back office and are marked as such, so nobody copies them
 * into a message to the owner or a buyer.
 */
export const LandParcelFacts = ({ detail }: { detail: AdminLandDiligenceDetail }) => {
  const { parcel, diligence } = detail;
  const boundaryCorners = (() => {
    const geometry = parcel.boundaryGeometry as { coordinates?: unknown[][] } | null | undefined;
    const ring = geometry?.coordinates?.[0];
    return Array.isArray(ring) ? Math.max(0, ring.length - 1) : 0;
  })();

  return (
    <LandCaseSection
      title="Parcel facts"
      description="What the owner declared. Private fields are visible to staff only."
      icon={Ruler}
    >
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Fact
          label="Plot / block"
          value={
            [
              parcel.plotNumber && `Plot ${parcel.plotNumber}`,
              parcel.block && `Block ${parcel.block}`,
            ]
              .filter(Boolean)
              .join(' · ') || notSupplied
          }
        />
        <Fact label="Estate / layout" value={parcel.estateName ?? notSupplied} />
        <Fact
          label="Area"
          value={`${parcel.areaValue.toLocaleString()} ${humaniseEnum(parcel.areaUnit).toLowerCase()}`}
        />
        <Fact
          label="Frontage × depth"
          value={
            parcel.frontage || parcel.depth
              ? `${parcel.frontage ?? '?'} × ${parcel.depth ?? '?'}`
              : notSupplied
          }
        />
        <Fact label="Title type" value={humaniseEnum(parcel.titleType) || notSupplied} />
        <Fact label="Tenure" value={parcel.tenure ?? notSupplied} />
        <PrivateFact label="Title number" value={parcel.titleNumber} />
        <PrivateFact label="Survey number" value={parcel.surveyNumber} />
        <PrivateFact label="Registry authority" value={parcel.registryAuthority} />
        <Fact
          label="Declared encumbrance status"
          value={humaniseEnum(parcel.encumbranceStatus) || notSupplied}
        />
        <Fact
          label="Zoning / permitted use"
          value={[parcel.zoning, parcel.permittedUse].filter(Boolean).join(' · ') || notSupplied}
        />
        <Fact label="Terrain" value={parcel.terrain ?? notSupplied} />
        <Fact label="Road access" value={yesNo(parcel.roadAccess)} />
        <Fact
          label="Utilities"
          value={parcel.utilities?.length ? parcel.utilities.join(', ') : notSupplied}
        />
        <Fact
          label="Boundary"
          value={
            boundaryCorners > 0
              ? `Surveyed polygon, ${boundaryCorners} corners`
              : parcel.boundaryNotes
                ? 'Notes only'
                : notSupplied
          }
        />
        <Fact
          label="Property ownership"
          value={detail.isPropertyVerified ? 'Verified' : 'Not yet verified'}
        />
        <Fact
          label="Asking price"
          value={
            detail.askingPrice !== undefined && detail.askingPrice !== null
              ? formatCurrency(detail.askingPrice)
              : 'No live sale listing'
          }
        />
        <Fact
          label="Submitted for review"
          value={diligence.submittedAt ? formatDate(diligence.submittedAt) : 'Not submitted'}
        />
      </div>
      {parcel.boundaryNotes && (
        <div className="mt-4 rounded-xl bg-secondary/45 p-3 text-sm">
          <p className="text-xs font-medium text-muted-foreground">Boundary notes</p>
          <p className="mt-1 whitespace-pre-wrap text-foreground">{parcel.boundaryNotes}</p>
        </div>
      )}
    </LandCaseSection>
  );
};

const PrivateFact = ({ label, value }: { label: string; value?: string | null }) => (
  <div className="min-w-0">
    <p className="flex items-center gap-1 text-xs font-medium text-muted-foreground">
      <Lock className="h-3 w-3" aria-hidden="true" />
      {label}
      <span className="sr-only">(staff only)</span>
    </p>
    <p className="mt-0.5 break-words font-mono text-sm text-foreground">{value || notSupplied}</p>
  </div>
);
