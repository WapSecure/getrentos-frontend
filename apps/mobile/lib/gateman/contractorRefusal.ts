import { ApiError } from '@/lib/api/client';

// Named because the offline queue recognises it: an unrecognised 403 reads as a lapsed session, which the queue
// replays forever. Kept parallel with apps/web/lib/gateman/contractorRefusal.ts.
export const CONTRACTOR_NOT_PERMITTED = 'CONTRACTOR_NOT_PERMITTED';

export interface ContractorRefusal {
  message: string;
}

export function readContractorRefusal(error: unknown): ContractorRefusal | null {
  if (!(error instanceof ApiError)) return null;
  if (error.code !== CONTRACTOR_NOT_PERMITTED) return null;

  const body = (error.details ?? {}) as { message?: unknown };
  return {
    message: typeof body.message === 'string' && body.message ? body.message : error.message,
  };
}
