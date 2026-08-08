'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ClipboardCheck, Clock, Star, RefreshCw } from 'lucide-react';
import { AgentNavbar } from '@/components/agent/navigation/AgentNavbar';
import { AgentSidebar } from '@/components/agent/dashboard/AgentSidebar';
import { TrustScoreRing } from '@/components/agent/trust/TrustScoreRing';
import { VerificationList } from '@/components/agent/trust/VerificationList';
import { TrustBadges } from '@/components/agent/trust/TrustBadges';
import { ROUTES, isAuthenticated, STORAGE_KEYS, getDashboardRoute } from '@/lib/constants/auth';
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
  const router = useRouter();
  const [user, setUser] = useState<{ fullName: string; email: string; role?: string } | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkAuth = () => {
      const authenticated = isAuthenticated();
      if (!authenticated) {
        router.replace(ROUTES.LOGIN);
        return;
      }
      const storedUser = localStorage.getItem(STORAGE_KEYS.USER);
      if (storedUser) {
        const parsedUser = JSON.parse(storedUser);
        setUser(parsedUser);
        if (parsedUser.role && parsedUser.role !== 'agent') {
          router.replace(getDashboardRoute(parsedUser.role));
          return;
        }
      }
      setIsLoading(false);
    };
    checkAuth();
  }, [router]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-[#0a1a1f] flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-[#c4a747] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const keyStats = [
    { icon: ClipboardCheck, label: 'Tasks Completed', value: '24' },
    { icon: Clock, label: 'Avg. Response Time', value: '< 1 hr' },
    { icon: RefreshCw, label: 'Sync Success Rate', value: '98%' },
    { icon: Star, label: 'Avg. Rating', value: '4.8 / 5' },
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#0a1a1f]">
      <AgentNavbar user={user} />

      <div className="flex">
        <AgentSidebar />

        <main className="flex-1 lg:ml-64 mt-16 p-6 lg:p-8">
          <div className="max-w-7xl mx-auto">
            <div className="mb-6">
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                Trust & Verification Profile
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                What clients and admins see about your credibility on GetRentos
              </p>
            </div>

            <div className="grid lg:grid-cols-3 gap-6 mb-6">
              <div className="bg-white dark:bg-[#1a2a2f] rounded-2xl border border-gray-200 dark:border-white/10 p-6 flex items-center justify-center">
                <TrustScoreRing score={89} />
              </div>

              <div className="lg:col-span-2 grid grid-cols-2 gap-4">
                {keyStats.map((stat) => (
                  <div
                    key={stat.label}
                    className="bg-white dark:bg-[#1a2a2f] rounded-2xl border border-gray-200 dark:border-white/10 p-4"
                  >
                    <div className="inline-flex p-2.5 rounded-xl bg-[#c4a747]/10 mb-3">
                      <stat.icon className="w-5 h-5 text-[#c4a747]" />
                    </div>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">{stat.label}</p>
                    <p className="text-xl font-bold text-gray-900 dark:text-white tracking-tight">
                      {stat.value}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid lg:grid-cols-2 gap-6">
              <VerificationList verifications={mockVerifications} />
              <TrustBadges badges={mockBadges} />
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
