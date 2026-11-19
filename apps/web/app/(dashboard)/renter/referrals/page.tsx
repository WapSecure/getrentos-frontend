import { ReferralSummaryCard } from '@/components/referral/ReferralSummaryCard';
import { Gift } from '@sureground/icons';
import { RenterPageHeader } from '@/components/renter/shared/RenterPageHeader';

export default function RenterReferralsPage() {
  return (
    <div>
      <RenterPageHeader
        eyebrow="Referrals"
        icon={Gift}
        title="Invite people"
        description="Invite people you know. A referral counts once they verify their identity."
      />
      <div className="max-w-2xl">
        <ReferralSummaryCard />
      </div>
    </div>
  );
}
