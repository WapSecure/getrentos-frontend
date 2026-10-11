import { authFetch, safeCall } from '@/lib/apiHelpers';
import type { ApiResponse } from '@/lib/apiHelpers';

export type DisbursementFrequency = 'WEEKLY' | 'FORTNIGHTLY' | 'MONTHLY';
export type DisbursementStatus = 'PENDING' | 'SUCCESS' | 'FAILED' | 'HELD';

export interface DisbursementRecord {
  id: string;
  amount: number;
  reserveAmount: number;
  balanceBefore: number;
  status: DisbursementStatus;
  heldReason: string | null;
  failureReason: string | null;
  paidAt: string | null;
  createdAt: string;
}

export interface DisbursementSchedule {
  schedule: {
    frequency: DisbursementFrequency;
    reserveAmount: number;
    enabled: boolean;
    nextRunAt: string;
  } | null;
  /** Whole naira GetRentos currently holds for the owner. */
  balance: number;
  recent: DisbursementRecord[];
}

export interface SetDisbursementScheduleInput {
  frequency: DisbursementFrequency;
  reserveAmount: number;
  enabled: boolean;
}

export const disbursementScheduleService = {
  get(): Promise<ApiResponse<DisbursementSchedule>> {
    return safeCall(() => authFetch('/landlord/disbursement-schedule'));
  },

  set(input: SetDisbursementScheduleInput): Promise<ApiResponse<DisbursementSchedule>> {
    return safeCall(() =>
      authFetch('/landlord/disbursement-schedule', {
        method: 'PUT',
        body: JSON.stringify(input),
      })
    );
  },
};
