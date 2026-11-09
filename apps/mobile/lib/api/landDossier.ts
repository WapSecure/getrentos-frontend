import type { BadgeTone } from '@sureground/ui-native';
import type { LandAssuranceTier, LandNotVerifiedItem, LandTrustLabel } from '@sureground/shared';
import { apiFetch } from './client';
import { toQuery } from './query';
import { formatNaira } from '../format';

/** Every view is recorded by the API. */

export type CostStatus = 'CONFIRMED' | 'ESTIMATED' | 'NOT_YET_KNOWN';

export interface AcquisitionCostItem {
  key: string;
  label: string;
  recurring: boolean;
  status: CostStatus;
  amount?: number;
  low?: number;
  high?: number;
  basis?: string;
}

export interface LandDossier {
  generatedAt: string;
  reviewedAt?: string;
  validUntil?: string;
  freshnessNote: string;
  subject: {
    kind: 'RESALE_LISTING' | 'ESTATE_PLOT';
    title: string;
    city: string;
    state: string;
    price: number;
    plot?: { plotNumber: string; block?: string; areaValue?: number; areaUnit?: string };
    planName?: string;
  };
  parcel: {
    titleType?: string;
    areaValue: number;
    areaUnit: string;
    roadAccess?: boolean;
    zoning?: string;
    permittedUse?: string;
    encumbranceStatus: string;
    boundarySignOff?: {
      version: number;
      status: 'UNREVIEWED' | 'SIGNED_OFF' | 'REJECTED';
      at?: string;
    };
  };
  assuranceTier?: LandAssuranceTier;
  riskScore?: number;
  riskBand?: 'LOW' | 'MODERATE' | 'HIGH';
  labels: LandTrustLabel[];
  notVerified: LandNotVerifiedItem[];
  titleChronology: {
    kind: string;
    occurredAt: string;
    registeredAt?: string;
    verified: boolean;
    documentOnFile: boolean;
  }[];
  sourceIndex: { documentType: string; count: number }[];
  outsideReviews: { role: string; completedAt?: string }[];
  checklist: { version?: string; policyPack?: { state: string; status: string } | null };
  acquisitionCost: {
    items: AcquisitionCostItem[];
    confirmedTotal: number;
    estimatedLow: number;
    estimatedHigh: number;
    unknownCount: number;
    estimatesDraft: boolean;
  };
  disclaimer: string;
}

export type DossierTarget =
  | { kind: 'listing'; listingId: string }
  | { kind: 'estate'; layoutId: string; plotId?: string; planId?: string };

export const COST_STATUS: Record<CostStatus, { label: string; tone: BadgeTone }> = {
  CONFIRMED: { label: 'Confirmed', tone: 'success' },
  ESTIMATED: { label: 'Estimated', tone: 'info' },
  NOT_YET_KNOWN: { label: 'Not yet known', tone: 'neutral' },
};

export function costFigure(item: AcquisitionCostItem): string {
  if (item.status === 'CONFIRMED') return formatNaira(item.amount ?? 0);
  if (item.status === 'ESTIMATED') {
    return item.low === item.high
      ? `≈ ${formatNaira(item.low ?? 0)}`
      : `${formatNaira(item.low ?? 0)} – ${formatNaira(item.high ?? 0)}`;
  }
  return '—';
}

export function estimatedTotal(cost: LandDossier['acquisitionCost']): string {
  return cost.estimatedLow === cost.estimatedHigh
    ? formatNaira(cost.estimatedLow)
    : `${formatNaira(cost.estimatedLow)} – ${formatNaira(cost.estimatedHigh)}`;
}

export const words = (value: string) => {
  const text = value.replace(/_/g, ' ').toLowerCase();
  return text.charAt(0).toUpperCase() + text.slice(1);
};

export const landDossierApi = {
  get: (t: DossierTarget) =>
    t.kind === 'listing'
      ? apiFetch<LandDossier>(`/land/listings/${encodeURIComponent(t.listingId)}/dossier`)
      : apiFetch<LandDossier>(
          `/land/layouts/${encodeURIComponent(t.layoutId)}/dossier${toQuery({ plotId: t.plotId, planId: t.planId })}`
        ),
};
