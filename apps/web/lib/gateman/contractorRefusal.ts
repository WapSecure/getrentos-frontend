import { ApiError } from '@/lib/apiHelpers';

// Named because the offline queue must recognise it: a 403 it does not recognise reads as a lapsed session.
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
