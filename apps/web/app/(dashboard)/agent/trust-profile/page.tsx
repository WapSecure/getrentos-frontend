'use client';

import { ClipboardCheck, Clock, Star, RefreshCw } from 'lucide-react';
import { TrustScoreRing } from '@/components/shared/trust/TrustScoreRing';
import { VerificationList } from '@/components/shared/trust/VerificationList';
import { TrustBadges } from '@/components/shared/trust/TrustBadges';
import type { VerificationItem, Badge } from '@/types/trust-score';
import { useQuery } from '@tanstack/react-query';
import { agentKeys } from '@/lib/queryKeys';
import { agentService } from '@/services/agentService';
import { unwrap } from '@/lib/apiHelpers';
import { useAgentUser } from '../layout';

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
  const user = useAgentUser();
  const { data: dashboard } = useQuery({
    queryKey: agentKeys.dashboard,
    queryFn: () => unwrap(agentService.getDashboard()),
  });
  const { data: profile } = useQuery({
    queryKey: agentKeys.profile,
    queryFn: () => unwrap(agentService.getProfile()),
  });
  const keyStats = [
    {
      icon: ClipboardCheck,
      label: 'Tasks Completed',
      value: String(dashboard?.completedTasks ?? 0),
    },
    { icon: Clock, label: 'Tasks In Progress', value: String(dashboard?.inProgressTasks ?? 0) },
    {
      icon: RefreshCw,
      label: 'Assigned Properties',
      value: String(dashboard?.assignedProperties ?? 0),
    },
    { icon: Star, label: 'Overdue Tasks', value: String(dashboard?.overdueTasks ?? 0) },
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
          <TrustScoreRing score={profile?.trustScore ?? (user ? 0 : 0)} />
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
