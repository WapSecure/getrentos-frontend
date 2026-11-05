import { ReferralSummaryCard } from '@/components/referral/ReferralSummaryCard';
import { PageHeader } from '@getrentos/ui';

export default function LandlordReferralsPage() {
  return (
    <div className="max-w-2xl">
      <PageHeader
        title="Refer & Earn"
        description="Share your code with other landlords: you both earn a reward when they sign up."
      />
      <ReferralSummaryCard />
    </div>
  );
}
