import type { FigureSource, ListingAnalysis, ListingAnalysisInput } from '@/types/investor';

/** The figures an investor may change, in the order the form shows them. */
export const ANALYSIS_FIELDS = [
  'annualRent',
  'vacancyPct',
  'rentGrowthPct',
  'maintenancePct',
  'managementFeePct',
  'legalFeesPct',
  'agencyFeePct',
  'consentPct',
] as const satisfies readonly (keyof ListingAnalysisInput)[];
export type AnalysisField = (typeof ANALYSIS_FIELDS)[number];

/** What the investor has typed, keyed by field; anything absent keeps the default. */
export type AnalysisEdits = Partial<Record<AnalysisField, string>>;

export const SOURCE_LABEL: Record<FigureSource, string> = {
  VERIFIED: 'Verified',
  THIRD_PARTY_ESTIMATE: 'Third-party estimate',
  YOUR_ASSUMPTION: 'Your assumption',
};

const RANGE: Record<AnalysisField, [number, number]> = {
  annualRent: [0, 1_000_000_000_000],
  vacancyPct: [0, 100],
  rentGrowthPct: [-50, 100],
  maintenancePct: [0, 100],
  managementFeePct: [0, 100],
  legalFeesPct: [0, 100],
  agencyFeePct: [0, 100],
  consentPct: [0, 100],
};

/** Only the edits that read as a number inside the API's range; the rest are left to the defaults. */
export function analysisInput(edits: AnalysisEdits): ListingAnalysisInput {
  const input: ListingAnalysisInput = {};
  for (const field of ANALYSIS_FIELDS) {
    const raw = edits[field]?.trim();
    if (!raw) continue;
    const n = Number(raw);
    const [min, max] = RANGE[field];
    if (!Number.isFinite(n) || n < min || n > max) continue;
    input[field] = field === 'annualRent' ? Math.round(n) : Math.round(n * 100) / 100;
  }
  return input;
}

/** The value the API used for a field, as the form shows it before any edit. */
export function analysisDefault(analysis: ListingAnalysis, field: AnalysisField): string {
  const cost = (key: string) => analysis.costs.find((c) => c.key === key)?.ratePct?.value;
  const value =
    field === 'legalFeesPct'
      ? cost('LEGAL_FEES')
      : field === 'agencyFeePct'
        ? cost('AGENCY_FEE')
        : field === 'consentPct'
          ? cost('CONSENT_AND_REGISTRATION')
          : analysis.assumptions[field].value;
  return value === null || value === undefined ? '' : String(value);
}

/** "5.1%", or a dash when there is nothing to show. */
export const percent = (value: number | null) => (value === null ? '—' : `${value}%`);
