'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { MessageCircle, Clock, ShieldCheck, Star } from 'lucide-react';
import { BuyerNavbar } from '@/components/buyer/navigation/BuyerNavbar';
import { BuyerSidebar } from '@/components/buyer/dashboard/BuyerSidebar';
import { TrustScoreRing } from '@/components/buyer/trust/TrustScoreRing';
import { VerificationList } from '@/components/buyer/trust/VerificationList';
import { TrustBadges } from '@/components/buyer/trust/TrustBadges';
import { ROUTES, isAuthenticated, STORAGE_KEYS, getDashboardRoute } from '@/lib/constants/auth';
import type { VerificationItem, Badge } from '@/types/trust-score';

const mockVerifications: VerificationItem[] = [
  {
    id: 'identity',
    label: 'Identity Verified',
    verified: true,
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
        if (parsedUser.role && parsedUser.role !== 'buyer') {
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
    { icon: MessageCircle, label: 'Response Rate', value: '94%' },
    { icon: Clock, label: 'Avg. Response Time', value: '< 4 hrs' },
    { icon: ShieldCheck, label: 'Completed Purchases', value: '1' },
    { icon: Star, label: 'Avg. Rating Given', value: '5.0 / 5' },
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#0a1a1f]">
      <BuyerNavbar user={user} />

      <div className="flex">
        <BuyerSidebar />

        <main className="flex-1 lg:ml-64 mt-16 p-6 lg:p-8">
          <div className="max-w-7xl mx-auto">
            <div className="mb-6">
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                Trust & Verification Profile
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                What owners and realtors see about your credibility on GetRentos
              </p>
            </div>

            <div className="grid lg:grid-cols-3 gap-6 mb-6">
              <div className="bg-white dark:bg-[#1a2a2f] rounded-2xl border border-gray-200 dark:border-white/10 p-6 flex items-center justify-center">
                <TrustScoreRing score={82} />
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
