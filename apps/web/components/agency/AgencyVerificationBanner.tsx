'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { ShieldAlert } from 'lucide-react';
import { agencyOnboardingService } from '@/services/agencyOnboardingService';

/**
 * Says, on every agency screen, when GetRentos has not verified the firm yet:
 * the firm can work, but payouts and the owners' directory wait on it.
 * Nothing shows for a verified firm, or for staff of a firm they do not own.
 */
export function AgencyVerificationBanner() {
  const pathname = usePathname();
  const { data } = useQuery({
    queryKey: ['agency', 'onboarding'],
    queryFn: async () => {
      const res = await agencyOnboardingService.mine();
      return res.success ? (res.data ?? null) : null;
    },
    staleTime: 60_000,
  });
  if (!data || data.status === 'ACTIVE' || pathname?.startsWith('/agency/setup')) return null;

  const kyb = data.profile?.kybStatus ?? 'NOT_SUBMITTED';
  const message =
    data.status === 'SUSPENDED'
      ? 'GetRentos has suspended this firm. Contact support.'
      : kyb === 'SUBMITTED'
        ? 'GetRentos is verifying your firm. Payouts and the owners’ directory open once it’s approved.'
        : kyb === 'REJECTED'
          ? 'Your verification needs changes before GetRentos can approve it.'
          : 'Finish your firm’s business verification to receive payouts and appear to owners.';

  return (
    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-warning/30 bg-warning-subtle px-6 py-2.5 text-sm text-warning">
      <span className="flex items-center gap-2">
        <ShieldAlert className="h-4 w-4 shrink-0" aria-hidden />
        {message}
      </span>
      {data.status !== 'SUSPENDED' && kyb !== 'SUBMITTED' && (
        <Link href="/agency/setup" className="font-medium underline-offset-2 hover:underline">
          Complete verification
        </Link>
      )}
    </div>
  );
}
