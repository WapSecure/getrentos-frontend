'use client';

import { ClipboardCheck, Clock, Star, RefreshCw } from 'lucide-react';
import { TrustScoreRing } from '@/components/agent/trust/TrustScoreRing';
import { VerificationList } from '@/components/agent/trust/VerificationList';
import { TrustBadges } from '@/components/agent/trust/TrustBadges';
import type { VerificationItem, Badge } from '@/types/trust-score';

const mockVerifications: VerificationItem[] = [
  {
    id: 'identity',
    label: 'Identity Verified',
    verified: true,
    date: '2025-11-01T00:00:00.000Z',
    description: 'Government-issued ID confirmed',
    icon: 'Shield',
  },
  {
    id: 'phone',
    label: 'Phone Number Verified',
    verified: true,
    date: '2025-11-01T00:00:00.000Z',
    description: 'Contact number confirmed via OTP',
    icon: 'Phone',
  },
  {
    id: 'email',
    label: 'Email Verified',
    verified: true,
    date: '2025-11-01T00:00:00.000Z',
    description: 'Email address confirmed',
    icon: 'Mail',
  },
  {
    id: 'field_badge',
    label: 'Field Agent ID Issued',
    verified: true,
    date: '2025-11-05T00:00:00.000Z',
    description: 'Official GetRentos field agent credential issued',
    icon: 'IdCard',
  },
];

const mockBadges: Badge[] = [
  {
    id: 'verified_agent',
    name: 'Verified Agent',
    icon: 'ShieldCheck',
    earned: true,
    description: 'Identity and credentials confirmed',
  },
  {
    id: 'thorough',
    name: 'Thorough Inspector',
    icon: 'ClipboardCheck',
    earned: true,
    description: '20+ inspections completed accurately',
  },
  {
    id: 'fast_responder',
    name: 'Fast Responder',
    icon: 'Zap',
    earned: true,
    description: 'Accepts and starts tasks within an hour',
  },
  {
    id: 'five_star',
    name: '5-Star Track Record',
    icon: 'Star',
    earned: false,
    description: 'Maintain a 5.0 average rating',
  },
];

export default function AgentTrustProfilePage() {
  const keyStats = [
    { icon: ClipboardCheck, label: 'Tasks Completed', value: '24' },
    { icon: Clock, label: 'Avg. Response Time', value: '< 1 hr' },
    { icon: RefreshCw, label: 'Sync Success Rate', value: '98%' },
    { icon: Star, label: 'Avg. Rating', value: '4.8 / 5' },
  ];

  return (
    <>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">Trust & Verification Profile</h1>
        <p className="text-muted-foreground mt-1">
          What clients and admins see about your credibility on GetRentos
        </p>
      </div>

      <div className="grid lg:grid-cols-3 gap-6 mb-6">
        <div className="bg-card rounded-2xl border border-border p-6 flex items-center justify-center">
          <TrustScoreRing score={89} />
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
