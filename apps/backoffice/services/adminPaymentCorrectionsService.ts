import { authFetch, safeCall, type ApiResponse } from '@sureground/shared';

export type CorrectionCategory = 'K1' | 'K2' | 'K3' | 'K4';

export interface CorrectionItem {
  sourceId: string;
  ownerId: string | null;
  organizationId: string | null;
  naira: number;
  label: string;
}

export interface CorrectionPreview {
  category: CorrectionCategory;
  treatment: string;
  items: CorrectionItem[];
  totalNaira: number;
}

export const adminPaymentCorrectionsService = {
  preview(): Promise<ApiResponse<CorrectionPreview[]>> {
    return safeCall(() => authFetch<CorrectionPreview[]>('/admin/payment-corrections'));
  },
  apply(
    category: CorrectionCategory
  ): Promise<ApiResponse<{ applied: number; totalNaira: number }>> {
    return safeCall(() =>
      authFetch<{ applied: number; totalNaira: number }>(
        `/admin/payment-corrections/${category}/apply`,
        {
          method: 'POST',
        }
      )
    );
  },
};
