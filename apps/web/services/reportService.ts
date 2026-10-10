import { authDownload, authFetch, safeCall, toQuery, type ApiResponse } from '@/lib/apiHelpers';

export interface RentRollRow {
  propertyTitle: string;
  unitName: string;
  tenantName: string | null;
  occupied: boolean;
  rentAmount: number | null;
  rentPeriod: string | null;
  leaseStart: string | null;
  leaseEnd: string | null;
  outstanding: number;
}

export interface PnlRow {
  propertyId: string;
  propertyTitle: string;
  income: number;
  expenses: number;
  net: number;
}

export interface PnlReport {
  from: string;
  to: string;
  rows: PnlRow[];
  totals: { income: number; expenses: number; net: number };
}

/** Pull a CSV the server generated and hand it to the browser as a download. */
async function download(path: string, filename: string): Promise<void> {
  const blob = await authDownload(path);
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
}

export const reportService = {
  rentRoll(): Promise<ApiResponse<RentRollRow[]>> {
    return safeCall(() => authFetch<RentRollRow[]>('/landlord/reports/rent-roll'));
  },

  pnl(params: { from?: string; to?: string } = {}): Promise<ApiResponse<PnlReport>> {
    return safeCall(() => authFetch<PnlReport>(`/landlord/reports/pnl${toQuery(params)}`));
  },

  downloadRentRollCsv(): Promise<ApiResponse<void>> {
    return safeCall(() =>
      download('/landlord/reports/rent-roll/export', 'getrentos-rent-roll.csv')
    );
  },

  downloadPnlCsv(params: { from?: string; to?: string } = {}): Promise<ApiResponse<void>> {
    return safeCall(() =>
      download(`/landlord/reports/pnl/export${toQuery(params)}`, 'getrentos-income-expenses.csv')
    );
  },

  downloadArrearsCsv(): Promise<ApiResponse<void>> {
    return safeCall(() => download('/landlord/reports/arrears/export', 'getrentos-arrears.csv'));
  },

  downloadStatementsCsv(): Promise<ApiResponse<void>> {
    return safeCall(() =>
      download('/landlord/reports/statements/export', 'getrentos-statements.csv')
    );
  },
};
