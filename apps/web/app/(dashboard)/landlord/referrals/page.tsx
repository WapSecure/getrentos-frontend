import { ReferralSummaryCard } from '@/components/referral/ReferralSummaryCard';
import { PageHeader } from '@sureground/ui';

export default function LandlordReferralsPage() {
  return (
    <div className="max-w-2xl">
      <PageHeader
        eyebrow="Account"
        title="Refer & earn"
        description="Share your code with other landlords: you both earn a reward when they sign up."
      />
      <ReferralSummaryCard />
    </div>
  );
}
