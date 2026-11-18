'use client';

import { useCallback, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  LEGAL_NAME_LOCKED_NOTE,
  isLegalNameLockedByKyc,
  isLegalNameLockedError,
  unwrap,
} from '@/lib/apiHelpers';
import { kycService } from '@/services/kycService';

export interface LegalNameLock {
  locked: boolean;
  /** Field hint while locked. */
  note: string | undefined;
  /** True when the save failed on the lock, which also locks the field from then on. */
  handleError: (error: unknown) => boolean;
}

/** Bank, payout and compliance checks compare against the legal name, so verified identity freezes it. */
export function useLegalNameLock(): LegalNameLock {
  const { data } = useQuery({
    queryKey: ['kyc-status'],
    queryFn: () => unwrap(kycService.getStatus()),
    staleTime: 60_000,
  });
  const [refused, setRefused] = useState(false);
  const locked = refused || isLegalNameLockedByKyc(data);

  const handleError = useCallback((error: unknown) => {
    if (!isLegalNameLockedError(error)) return false;
    setRefused(true);
    return true;
  }, []);

  return { locked, note: locked ? LEGAL_NAME_LOCKED_NOTE : undefined, handleError };
}
