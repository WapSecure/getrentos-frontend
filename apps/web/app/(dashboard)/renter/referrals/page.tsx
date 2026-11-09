import { ReferralSummaryCard } from '@/components/referral/ReferralSummaryCard';
import { Gift } from '@sureground/icons';
import { RenterPageHeader } from '@/components/renter/shared/RenterPageHeader';

export default function RenterReferralsPage() {
  return (
    <div>
      <RenterPageHeader
        eyebrow="Rewards"
        icon={Gift}
        title="Refer & earn"
        description="Invite friends to Sureground and track the rewards earned from successful referrals."
      />
      <div className="max-w-2xl">
        <ReferralSummaryCard />
      </div>
    </div>
  );
}
