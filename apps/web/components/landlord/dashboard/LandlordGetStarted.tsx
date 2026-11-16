'use client';

import { useQuery } from '@tanstack/react-query';
import { Building2, Landmark, ShieldCheck, UserPlus } from '@sureground/icons';
import {
  GetStartedCard,
  useGetStartedDismissed,
} from '@/components/shared/dashboard/GetStartedCard';
import { IdentityNudge } from '@/components/shared/verification/IdentityNudge';
import { kycService } from '@/services/kycService';
import {
  landlordService,
  type LandlordDashboardStats,
  type LandlordPayoutAccount,
} from '@/services/landlordService';
import { unwrap, unwrapOptional } from '@/lib/apiHelpers';
import { landlordKeys } from '@/lib/queryKeys';
import { identityGate } from '@/lib/identityGate';
import { ROUTES } from '@/lib/constants/auth';

const CHECKLIST_ID = 'landlord';

export function LandlordGetStarted({ stats }: { stats: LandlordDashboardStats | undefined }) {
  const dismissed = useGetStartedDismissed(CHECKLIST_ID);
  const kyc = useQuery({
    queryKey: ['kyc-status'],
    queryFn: () => unwrap(kycService.getStatus()),
    staleTime: 60_000,
  });
  const payout = useQuery({
    queryKey: landlordKeys.payoutAccount,
    queryFn: () =>
      unwrapOptional<LandlordPayoutAccount | null>(landlordService.getPayoutAccount(), null),
    enabled: !dismissed,
  });

  const nudge = (
    <IdentityNudge
      verificationHref={ROUTES.LANDLORD_VERIFICATION}
      unlocks="publish listings, sign leases and receive payouts"
      className="mb-6"
    />
  );
  if (dismissed || kyc.isError || payout.isError) return nudge;
  // Nothing until every answer is in, so a finished step never shows as to do.
  if (!stats || !kyc.data || payout.isPending) return null;

  const gate = identityGate(kyc.data);

  return (
    <GetStartedCard
      className="mb-6"
      id={CHECKLIST_ID}
      description="Four steps to start collecting rent through Sureground."
      steps={[
        {
          title: 'Verify your identity',
          body:
            gate === 'in_review'
              ? 'Your check is being reviewed. We will let you know when it clears.'
              : 'Needed to publish listings, sign leases and receive payouts.',
          icon: ShieldCheck,
          href: ROUTES.LANDLORD_VERIFICATION,
          done: gate === 'verified',
        },
        {
          title: 'Add your first property',
          body: 'Add its address and units so you can list them and track rent.',
          icon: Building2,
          href: `${ROUTES.LANDLORD_PROPERTIES}?add=1`,
          done: stats.totalProperties > 0,
        },
        {
          title: 'Add a payout account',
          body: 'The bank account your rent is paid into.',
          icon: Landmark,
          href: `${ROUTES.LANDLORD_SETTINGS}?tab=payouts`,
          done: Boolean(payout.data?.accountNumber),
        },
        {
          title: 'Add your first tenancy',
          body: 'Create a lease for a unit and send it to your tenant to sign.',
          icon: UserPlus,
          href: `${ROUTES.LANDLORD_LEASES}?create=1`,
          done: stats.occupiedUnits + stats.reservedUnits > 0,
        },
      ]}
    />
  );
}
