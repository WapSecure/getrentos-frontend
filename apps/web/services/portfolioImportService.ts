import { authFetch, safeCall, type ApiResponse } from '@/lib/apiHelpers';

export interface ImportedUnitRow {
  line: number;
  unitName: string;
  bedrooms: number;
  bathrooms: number;
  askingRent: number | null;
  rentPeriod: 'MONTHLY' | 'ANNUAL';
}

export interface UnitImportResult {
  dryRun: boolean;
  propertyId: string;
  propertyTitle: string;
  fileError: string | null;
  toCreate: ImportedUnitRow[];
  skipped: { line: number; unitName: string; reason: string }[];
  errors: { line: number; unitName: string; errors: string[] }[];
  created: number;
}

export const UNITS_CSV_TEMPLATE =
  'unit_name,bedrooms,bathrooms,asking_rent,rent_period\nFlat 1,2,2,2400000,ANNUAL\nFlat 2,3,2,,ANNUAL\n';

export const portfolioImportService = {
  units: (input: {
    propertyId: string;
    csv: string;
    dryRun: boolean;
  }): Promise<ApiResponse<UnitImportResult>> =>
    safeCall(() =>
      authFetch<UnitImportResult>('/agency/import/units', {
        method: 'POST',
        body: JSON.stringify(input),
      })
    ),
};
