import { useState } from 'react';
import { apiErrorCode } from '@/lib/auth/signupErrors';
import { useIdentityVerification } from './useIdentityVerification';

export const LEGAL_NAME_LOCKED = 'LEGAL_NAME_LOCKED';

const LOCKED_HINT =
  'Locked because your identity is verified. To change it, verify your identity again with the new name, or contact support.';

// Bank and payout name checks rely on the verified name, so the API refuses edits; the form says so up front.
export function useLegalNameLock() {
  const { verified } = useIdentityVerification();
  const [refused, setRefused] = useState(false);
  const locked = verified || refused;
  return {
    locked,
    fieldProps: locked ? { editable: false, hint: LOCKED_HINT } : {},
    /** True when the save failed only because the name is locked; the caller restores the saved name. */
    lockedBy: (err: unknown) => {
      if (apiErrorCode(err) !== LEGAL_NAME_LOCKED) return false;
      setRefused(true);
      return true;
    },
  };
}
