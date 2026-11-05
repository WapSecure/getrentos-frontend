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
  className,
}: {
  verificationHref: string;
  /** What verification unlocks for this workspace, e.g. "publish listings, sign leases and receive payouts". */
  unlocks: string;
  className?: string;
}) {
  const { data } = useQuery({
    queryKey: ['kyc-status'],
    queryFn: () => unwrap(kycService.getStatus()),
    staleTime: 60_000,
  });
  if (!data) return null;
  const verified = data.identityVerified ?? ((data.tier ?? 0) >= 2 || data.isVerified);
  if (verified) return null;
  const inReview = data.identity && data.identity.status === 'PENDING';

  return (
    <Alert variant="warning" icon={ShieldAlert} className={className}>
      <p>
        {inReview
          ? `Your identity check is being reviewed. Once it clears you can ${unlocks}.`
          : `Verify your identity to ${unlocks}. It takes a few minutes.`}
      </p>
      {!inReview && (
        <Link
          href={verificationHref}
          className="inline-block mt-1 font-medium text-foreground underline hover:no-underline"
        >
          Verify identity
        </Link>
      )}
    </Alert>
  );
}
