import { ReferralSummaryCard } from '@/components/referral/ReferralSummaryCard';
import { Gift } from 'lucide-react';
import { RenterPageHeader } from '@/components/renter/shared/RenterPageHeader';

export default function RenterReferralsPage() {
  return (
    <div>
      <RenterPageHeader
        eyebrow="Rewards"
        icon={Gift}
        title="Refer & earn"
        description="Invite friends to GetRentos and track the rewards earned from successful referrals."
      />
      <div className="max-w-2xl">
        <ReferralSummaryCard />
      </div>
    </div>
  );
}
