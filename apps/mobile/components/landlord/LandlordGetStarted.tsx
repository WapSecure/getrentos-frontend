import { router } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { Building2, Landmark, ShieldCheck, UserPlus } from '@sureground/icons/native';
import { GetStartedCard, useGetStartedDismissed } from '@/components/dashboard/GetStartedCard';
import { IdentityNudge, useIdentityVerified } from '@/components/trust/IdentityNudge';
import { kycApi } from '@/lib/api/kyc';
import { landlordApi, type LandlordDashboardStats } from '@/lib/api/landlord';
import { qk } from '@/lib/query/keys';

const CHECKLIST_ID = 'landlord';

export function LandlordGetStarted({
  stats,
  onAddProperty,
}: {
  stats: LandlordDashboardStats | undefined;
  onAddProperty: () => void;
}) {
  const dismissed = useGetStartedDismissed(CHECKLIST_ID);
  const verified = useIdentityVerified();
  const kyc = useQuery({ queryKey: ['kyc-status'], queryFn: kycApi.getStatus });
  const payout = useQuery({
    queryKey: qk.landlord.payout,
    queryFn: async () => (await landlordApi.payoutAccount()) ?? null,
    enabled: dismissed === false,
  });

  const nudge = <IdentityNudge unlocks="listings, leases and payouts" />;
  if (dismissed || kyc.isError || payout.isError) return nudge;
  // Nothing until every answer is in, so a finished step never shows as to do.
  if (dismissed === null || !stats || verified === null || payout.isPending) return null;

  const inReview = kyc.data?.identity?.status === 'PENDING_REVIEW';
  return (
    <GetStartedCard
      id={CHECKLIST_ID}
      description="Four steps to start collecting rent through Sureground."
      steps={[
        {
          title: 'Verify your identity',
          body: inReview
            ? 'Your check is being reviewed. We will let you know when it clears.'
            : 'Needed to publish listings, sign leases and receive payouts.',
          Icon: ShieldCheck,
          onPress: () => router.push('/(app)/verify-identity'),
          done: verified,
        },
        {
          title: 'Add your first property',
          body: 'Add its address and units so you can list them and track rent.',
          Icon: Building2,
          onPress: onAddProperty,
          done: stats.totalProperties > 0,
        },
        {
          title: 'Add a payout account',
          body: 'The bank account your rent is paid into.',
          Icon: Landmark,
          onPress: () => router.push('/(app)/landlord-settings'),
          done: Boolean(payout.data?.accountNumber),
        },
        {
          title: 'Add your first tenancy',
          body: 'Create a lease for a unit and send it to your tenant to sign.',
          Icon: UserPlus,
          onPress: () =>
            router.push({ pathname: '/(app)/landlord-leases', params: { create: '1' } }),
          done: stats.occupiedUnits + stats.reservedUnits > 0,
        },
      ]}
    />
  );
}
