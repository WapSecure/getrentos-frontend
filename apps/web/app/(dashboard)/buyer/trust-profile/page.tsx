'use client';

import { useQuery } from '@tanstack/react-query';
import { MessageCircle, Clock, ShieldCheck, Star } from 'lucide-react';
import { TrustScoreRing } from '@/components/buyer/trust/TrustScoreRing';
import { VerificationList } from '@/components/buyer/trust/VerificationList';
import { TrustBadges } from '@/components/buyer/trust/TrustBadges';
import { buyerService } from '@/services/buyerService';
import { buyerKeys } from '@/lib/queryKeys';
import { unwrap } from '@/lib/apiHelpers';
import type { VerificationItem, Badge } from '@/types/trust-score';

const mockBadges: Badge[] = [
  {
    id: 'verified_buyer',
    name: 'Verified Buyer',
    icon: 'ShieldCheck',
    earned: true,
    description: 'Identity and funds confirmed',
  },
  {
    id: 'fast_responder',
    name: 'Fast Responder',
    icon: 'Zap',
    earned: true,
    description: 'Replies to owners within a few hours',
  },
  {
    id: 'trusted_negotiator',
    name: 'Trusted Negotiator',
    icon: 'Handshake',
    earned: false,
    description: 'Complete 3+ negotiated offers',
  },
  {
    id: 'five_star',
    name: '5-Star Reviewer',
    icon: 'Star',
    earned: true,
    description: 'Left thoughtful reviews after purchase',
  },
];

export default function BuyerTrustProfilePage() {
  const { data: profile } = useQuery({
    queryKey: buyerKeys.profile,
    queryFn: () => unwrap(buyerService.getProfile()),
  });

  const trustScore = profile?.trustScore ?? 82;
  const verificationStatus = profile?.verificationStatus ?? 'PENDING';

  const verifications: VerificationItem[] = [
    {
      id: 'identity',
      label: 'Identity Verified',
      verified: verificationStatus !== 'PENDING' && verificationStatus !== 'UNVERIFIED',
      date: '2026-01-10T00:00:00.000Z',
      description: 'Government-issued ID confirmed',
      icon: 'Shield',
    },
    {
      id: 'phone',
      label: 'Phone Number Verified',
      verified: true,
      date: '2026-01-10T00:00:00.000Z',
      description: 'Contact number confirmed via OTP',
      icon: 'Phone',
    },
    {
      id: 'email',
      label: 'Email Verified',
      verified: true,
      date: '2026-01-10T00:00:00.000Z',
      description: 'Email address confirmed',
      icon: 'Mail',
    },
    {
      id: 'proof_of_funds',
      label: 'Proof of Funds Verified',
      verified: true,
      date: '2026-07-15T00:00:00.000Z',
      description: 'Bank statement or mortgage pre-approval on file',
      icon: 'CreditCard',
    },
    {
      id: 'bank_account',
      label: 'Payment Account Verified',
      verified: false,
      description: 'Add a verified bank account for faster escrow payments',
      icon: 'Landmark',
    },
  ];

  const keyStats = [
    { icon: MessageCircle, label: 'Response Rate', value: '94%' },
    { icon: Clock, label: 'Avg. Response Time', value: '< 4 hrs' },
    { icon: ShieldCheck, label: 'Completed Purchases', value: '1' },
    { icon: Star, label: 'Trust Score', value: `${trustScore} / 100` },
  ];

  return (
    <>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">Trust & Verification Profile</h1>
        <p className="text-muted-foreground mt-1">
          What owners and realtors see about your credibility on GetRentos
        </p>
      </div>

      <div className="grid lg:grid-cols-3 gap-6 mb-6">
        <div className="bg-card rounded-2xl border border-border p-6 flex items-center justify-center">
          <TrustScoreRing score={trustScore} />
        </div>

        <div className="lg:col-span-2 grid grid-cols-2 gap-4">
          {keyStats.map((stat) => (
            <div key={stat.label} className="bg-card rounded-2xl border border-border p-4">
              <div className="inline-flex p-2.5 rounded-xl bg-accent mb-3">
                <stat.icon className="w-5 h-5 text-primary" />
              </div>
              <p className="text-sm text-muted-foreground mb-1">{stat.label}</p>
              <p className="text-xl font-bold text-foreground tracking-tight">{stat.value}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <VerificationList verifications={verifications} />
        <TrustBadges badges={mockBadges} />
      </div>
    </>
  );
}
