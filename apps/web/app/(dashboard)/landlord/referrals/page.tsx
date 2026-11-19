import { ReferralSummaryCard } from '@/components/referral/ReferralSummaryCard';
import { PageHeader } from '@sureground/ui';

export default function LandlordReferralsPage() {
  return (
    <div className="max-w-2xl">
      <PageHeader
        eyebrow="Account"
        title="Invite people"
        description="Invite people you know. A referral counts once they verify their identity."
      />
      <ReferralSummaryCard />
    </div>
  );
}
