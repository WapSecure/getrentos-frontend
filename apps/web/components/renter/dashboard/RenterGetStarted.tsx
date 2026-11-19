'use client';

import { useQuery } from '@tanstack/react-query';
import { Search, ShieldCheck } from '@sureground/icons';
import { GetStartedCard } from '@/components/shared/dashboard/GetStartedCard';
import { kycService } from '@/services/kycService';
import { renterService } from '@/services/renterService';
import { unwrap } from '@/lib/apiHelpers';
import { renterKeys } from '@/lib/queryKeys';
import { identityGate } from '@/lib/identityGate';
import { ROUTES } from '@/lib/constants/auth';

export function RenterGetStarted() {
  const kyc = useQuery({
    queryKey: ['kyc-status'],
    queryFn: () => unwrap(kycService.getStatus()),
    staleTime: 60_000,
  });
  // A renter with no lease gets an error here, which only means "not housed yet".
  const lease = useQuery({
    queryKey: renterKeys.lease,
    queryFn: () => unwrap(renterService.getLease()),
    retry: false,
  });

  // Nothing until both answers are in, so a finished step never flashes as to do.
  if (!kyc.data || lease.isPending) return null;
  const gate = identityGate(kyc.data);

  return (
    <GetStartedCard
      id="renter"
      description="Two things that make renting through Sureground quicker."
      steps={[
        {
          title: 'Find a home',
          body: 'Search verified homes and book a viewing with the landlord.',
          icon: Search,
          href: ROUTES.RENTER_DISCOVER,
          done: !!lease.data,
        },
        {
          title: 'Verify your ID',
          body:
            gate === 'in_review'
              ? 'Your check is being reviewed. We will let you know when it clears.'
              : 'Your ID is checked before you pay or sign. Doing it now saves time later.',
          icon: ShieldCheck,
          href: ROUTES.RENTER_VERIFICATION,
          done: gate === 'verified',
        },
      ]}
    />
  );
}
