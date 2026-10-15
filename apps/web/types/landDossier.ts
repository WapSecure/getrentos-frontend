import type { LandNotVerifiedItem, LandTrustLabel } from './land';

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
    boundaryGeometry?: Record<string, unknown>;
  };
  assuranceTier?: string;
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
