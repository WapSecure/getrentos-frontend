'use client';

import Link from 'next/link';
import type { ReactNode } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ShieldAlert } from '@sureground/icons';
import { Alert } from '@sureground/ui/Alert';
import { unwrap } from '@/lib/apiHelpers';
import { ROUTES } from '@/lib/constants/auth';
import { depositIdentityNotice, identityGate } from '@/lib/identityGate';
import { kycService } from '@/services/kycService';

/**
 * The server refuses a deposit from a buyer whose identity is not verified (the same rule as
 * making an offer). Returns the notice to pass to PayDialog's `blocked`, or null to let them pay.
 * A loading or failed status never blocks; the server still has the final say.
 */
export function useDepositIdentityNotice(enabled: boolean): ReactNode | null {
  const { data: kycStatus } = useQuery({
    queryKey: ['kyc-status'],
    queryFn: () => unwrap(kycService.getStatus()),
    enabled,
    staleTime: 60_000,
  });
  const notice = enabled ? depositIdentityNotice(identityGate(kycStatus)) : null;
  if (!notice) return null;
  return (
    <Alert variant="warning" icon={ShieldAlert}>
      <p>{notice.message}</p>
      {notice.verifyLink && (
        <Link
          href={ROUTES.BUYER_VERIFICATION}
          className="inline-block mt-1 font-medium text-foreground underline hover:no-underline"
        >
          Verify identity
        </Link>
      )}
    </Alert>
  );
}
