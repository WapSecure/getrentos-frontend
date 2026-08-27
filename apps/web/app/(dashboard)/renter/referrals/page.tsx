import { ReferralSummaryCard } from '@/components/referral/ReferralSummaryCard';

export default function RenterReferralsPage() {
  return (
    <div className="max-w-2xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">Refer & Earn</h1>
        <p className="text-muted-foreground mt-1">
          Share your code with friends — you both earn a reward when they sign up.
        </p>
      </div>
      <ReferralSummaryCard />
    </div>
  );
}
