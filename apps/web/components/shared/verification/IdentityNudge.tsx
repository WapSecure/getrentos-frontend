'use client';

import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { ShieldAlert } from 'lucide-react';
import { Alert } from '@getrentos/ui';
import { kycService } from '@/services/kycService';
import { unwrap } from '@/lib/apiHelpers';

/**
 * Tells a person whose identity is not yet verified, before they start, what
 * verification unlocks and where to do it. Without this they learn about the
 * gate only when a filled-in form is refused (publishing a listing 403s).
 * Renders nothing while loading, on error, or once identity is verified.
 */
export function IdentityNudge({
  verificationHref,
  unlocks,
  requirement = 'identity',
  className,
}: {
  verificationHref: string;
  /** What verification unlocks for this workspace, e.g. "publish listings, sign leases and receive payouts". */
  unlocks: string;
  /** Realtors and agents are also gated on a verified licence. */
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
