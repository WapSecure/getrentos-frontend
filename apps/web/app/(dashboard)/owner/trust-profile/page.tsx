'use client';

import { MessageCircle, Clock, ShieldCheck, Star } from 'lucide-react';
import { TrustScoreRing } from '@/components/owner/trust/TrustScoreRing';
import { VerificationList } from '@/components/owner/trust/VerificationList';
import { TrustBadges } from '@/components/owner/trust/TrustBadges';
import type { VerificationItem, Badge } from '@/types/trust-score';

const mockVerifications: VerificationItem[] = [
  {
    id: 'identity',
    label: 'Identity Verified',
    verified: true,
    date: '2022-02-14T00:00:00.000Z',
    description: 'Government-issued ID confirmed',
    icon: 'Shield',
  },
  {
    id: 'phone',
    label: 'Phone Number Verified',
    verified: true,
    date: '2022-02-14T00:00:00.000Z',
    description: 'Contact number confirmed via OTP',
    icon: 'Phone',
  },
  {
    id: 'email',
    label: 'Email Verified',
    verified: true,
    date: '2022-02-14T00:00:00.000Z',
    description: 'Email address confirmed',
    icon: 'Mail',
  },
  {
    id: 'property_ownership',
    label: 'Property Ownership Verified',
    verified: true,
    date: '2022-03-12T00:00:00.000Z',
    description: 'At least one property has passed ownership review',
    icon: 'Building2',
  },
  {
    id: 'bank_account',
    label: 'Payout Bank Account Verified',
    verified: true,
    date: '2022-02-20T00:00:00.000Z',
    description: 'Bank account confirmed for escrow payouts',
    icon: 'Landmark',
  },
];

const mockBadges: Badge[] = [
  {
    id: 'verified_seller',
    name: 'Verified Seller',
    icon: 'ShieldCheck',
    earned: true,
    description: 'Ownership confirmed by compliance',
  },
  {
    id: 'fast_responder',
    name: 'Fast Responder',
    icon: 'Zap',
    earned: true,
    description: 'Replies to buyers within a few hours',
  },
  {
    id: 'five_star',
    name: '5-Star Track Record',
    icon: 'Star',
    earned: false,
    description: 'Maintain a 5.0 average rating',
  },
  {
    id: 'escrow_pro',
    name: 'Escrow Pro',
    icon: 'Handshake',
    earned: true,
    description: '3+ transactions closed through escrow',
  },
];

export default function OwnerTrustProfilePage() {
  const keyStats = [
    { icon: MessageCircle, label: 'Response Rate', value: '96%' },
    { icon: Clock, label: 'Avg. Response Time', value: '< 3 hrs' },
    { icon: ShieldCheck, label: 'Completed Sales', value: '3' },
    { icon: Star, label: 'Avg. Rating', value: '4.3 / 5' },
  ];

  return (
    <>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">Trust & Verification Profile</h1>
        <p className="text-muted-foreground mt-1">
          What buyers and realtors see about your credibility on GetRentos
        </p>
      </div>

      <div className="grid lg:grid-cols-3 gap-6 mb-6">
        <div className="bg-card rounded-2xl border border-border p-6 flex items-center justify-center">
          <TrustScoreRing score={88} />
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
        <VerificationList verifications={mockVerifications} />
        <TrustBadges badges={mockBadges} />
      </div>
    </>
  );
}
