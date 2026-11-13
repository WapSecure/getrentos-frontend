'use client';

import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { ShieldAlert } from '@sureground/icons';
import { Alert } from '@sureground/ui';
import { kycService } from '@/services/kycService';
import { unwrap } from '@/lib/apiHelpers';

/*
 * No deadline here: the identity gate on inviting clients and publishing listings refuses an unverified
 * account even during the identity grace period, so "verify by <date>" promised time that was not there.
 * Say what is blocked now instead.
 */

export function IdentityNudge({
  verificationHref,
  unlocks,
  requirement = 'identity',
  className,
}: {
  verificationHref: string;
  unlocks: string;
  requirement?: 'identity' | 'licence';
  className?: string;
}) {
  const { data } = useQuery({
    queryKey: ['kyc-status'],
    queryFn: () => unwrap(kycService.getStatus()),
    staleTime: 60_000,
  });
  if (!data) return null;
  const licence = requirement === 'licence';
  const verified = licence
    ? data.license?.status === 'APPROVED'
    : (data.identityVerified ?? ((data.tier ?? 0) >= 2 || data.isVerified));
  if (verified) return null;
  const row = licence ? data.license : data.identity;
  const inReview = row?.status === 'PENDING' || row?.status === 'PENDING_REVIEW';
  const what = licence ? 'licence' : 'identity';

  return (
    <Alert variant="warning" icon={ShieldAlert} className={className}>
      <p>
        {inReview
          ? `Your ${what} check is being reviewed. Once it clears you can ${unlocks}.`
          : licence
            ? `Verify your licence to ${unlocks}.`
            : `Verify your identity to ${unlocks}. It takes a few minutes.`}
      </p>
      {!inReview && (
        <Link
          href={verificationHref}
          className="inline-block mt-1 font-medium text-foreground underline hover:no-underline"
        >
          {licence ? 'Verify licence' : 'Verify identity'}
        </Link>
      )}
    </Alert>
  );
}
