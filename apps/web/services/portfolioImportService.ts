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

export interface ImportedTenancyRow {
  line: number;
  unitName: string;
  tenantName: string;
  tenantEmail: string | null;
  rentAmount: number;
  rentPeriod: 'MONTHLY' | 'ANNUAL';
  leaseStart: string;
  leaseEnd: string;
  depositAmount: number | null;
  arrearsAmount: number | null;
  nextDueDate: string | null;
  /** LINKED: matched to the tenant's GetRentos account by email. */
  tenantAccount: 'LINKED' | 'NAME_ONLY';
}

export interface TenancyImportResult {
  dryRun: boolean;
  propertyId: string;
  propertyTitle: string;
  fileError: string | null;
  toImport: ImportedTenancyRow[];
  errors: { line: number; unitName: string; errors: string[] }[];
  imported: number;
  schedulesStarted: number;
}

export const TENANCIES_CSV_TEMPLATE =
  'unit_name,tenant_name,tenant_email,tenant_phone,rent_amount,rent_period,lease_start,lease_end,deposit_amount,arrears_amount,next_due_date\n' +
  'Flat 1,Ada Okafor,ada@example.com,08030000000,2400000,ANNUAL,2026-03-01,2028-02-29,500000,,2027-03-01\n';

export const portfolioImportService = {
  tenancies: (input: {
    propertyId: string;
    csv: string;
    dryRun: boolean;
  }): Promise<ApiResponse<TenancyImportResult>> =>
    safeCall(() =>
      authFetch<TenancyImportResult>('/agency/import/tenancies', {
        method: 'POST',
        body: JSON.stringify(input),
      })
    ),
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
