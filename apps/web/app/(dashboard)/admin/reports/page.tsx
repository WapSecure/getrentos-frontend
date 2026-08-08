'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { DollarSign, Users, ShieldCheck, TrendingUp, FileSpreadsheet, Check } from 'lucide-react';
import { AdminNavbar } from '@/components/admin/navigation/AdminNavbar';
import { AdminSidebar } from '@/components/admin/dashboard/AdminSidebar';
import { PlatformRevenueChart } from '@/components/admin/reports/PlatformRevenueChart';
import { Button } from '@/components/ui/Button';
import { formatCurrency } from '@/lib/format';
import { ROUTES, isAuthenticated, STORAGE_KEYS, getDashboardRoute } from '@/lib/constants/auth';

const stats = [
  {
    icon: DollarSign,
    label: 'Platform GMV (YTD)',
    value: formatCurrency(1_840_000_000, { compact: true }),
    color: 'gold',
  },
  { icon: Users, label: 'Active Users', value: '1,920', color: 'blue' },
  { icon: ShieldCheck, label: 'Avg. Trust Score', value: '78', color: 'green' },
  { icon: TrendingUp, label: 'Month-over-Month Growth', value: '+8.9%', color: 'emerald' },
] as const;

const colorClasses = {
  blue: { bg: 'bg-blue-50 dark:bg-blue-950/20', icon: 'text-blue-600 dark:text-blue-400' },
  gold: { bg: 'bg-[#c4a747]/10', icon: 'text-[#c4a747]' },
  green: { bg: 'bg-green-50 dark:bg-green-950/20', icon: 'text-green-600 dark:text-green-400' },
  emerald: {
    bg: 'bg-emerald-50 dark:bg-emerald-950/20',
    icon: 'text-emerald-600 dark:text-emerald-400',
  },
} as const;

interface RevenueBreakdown {
  category: string;
  amount: number;
  share: number;
}

const breakdown: RevenueBreakdown[] = [
  { category: 'Escrow Transactions', amount: 980_000_000, share: 53 },
  { category: 'Lease Payments', amount: 460_000_000, share: 25 },
  { category: 'Realtor & Agent Commissions', amount: 260_000_000, share: 14 },
  { category: 'Platform Service Fees', amount: 140_000_000, share: 8 },
];

export default function AdminReportsPage() {
  const router = useRouter();
  const [user, setUser] = useState<{ fullName: string; email: string; role?: string } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [exported, setExported] = useState(false);

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
        if (parsedUser.role && parsedUser.role !== 'admin') {
          router.replace(getDashboardRoute(parsedUser.role));
          return;
        }
      }
      setIsLoading(false);
    };
    checkAuth();
  }, [router]);

  const handleExport = () => {
    setExported(true);
    window.setTimeout(() => setExported(false), 2500);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-[#0a1a1f] flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-[#c4a747] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#0a1a1f]">
      <AdminNavbar user={user} />

      <div className="flex">
        <AdminSidebar />

        <main className="flex-1 lg:ml-64 mt-16 p-6 lg:p-8">
          <div className="max-w-7xl mx-auto">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                  Reports &amp; Analytics
                </h1>
                <p className="text-gray-600 dark:text-gray-400 mt-1">
                  Platform-wide performance and revenue insights
                </p>
              </div>
              <Button variant="outline" size="sm" className="gap-1.5" onClick={handleExport}>
                {exported ? (
                  <Check className="w-3.5 h-3.5 text-green-500" />
                ) : (
                  <FileSpreadsheet className="w-3.5 h-3.5" />
                )}
                {exported ? 'Exported' : 'Export CSV'}
              </Button>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              {stats.map((stat) => {
                const colors = colorClasses[stat.color];
                return (
                  <div
                    key={stat.label}
                    className="rounded-2xl bg-white dark:bg-[#1a2a2f] border border-gray-200 dark:border-white/10 p-4"
                  >
                    <div className={`inline-flex p-2.5 rounded-xl ${colors.bg} mb-3`}>
                      <stat.icon className={`w-5 h-5 ${colors.icon}`} />
                    </div>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">{stat.label}</p>
                    <p className="text-xl font-bold text-gray-900 dark:text-white tracking-tight">
                      {stat.value}
                    </p>
                  </div>
                );
              })}
            </div>

            <div className="mb-6">
              <PlatformRevenueChart />
            </div>

            <div className="bg-white dark:bg-[#1a2a2f] rounded-2xl border border-gray-200 dark:border-white/10 overflow-hidden">
              <div className="p-5 border-b border-gray-100 dark:border-white/5">
                <h3 className="font-semibold text-gray-900 dark:text-white">
                  GMV Breakdown by Category
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                  Year-to-date share of total platform GMV
                </p>
              </div>
              <div className="divide-y divide-gray-100 dark:divide-white/5">
                {breakdown.map((row) => (
                  <div key={row.category} className="flex items-center gap-4 p-4">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2 mb-1.5">
                        <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                          {row.category}
                        </p>
                        <p className="text-sm font-semibold text-gray-900 dark:text-white whitespace-nowrap">
                          {formatCurrency(row.amount, { compact: true })}
                        </p>
                      </div>
                      <div className="h-1.5 rounded-full bg-gray-100 dark:bg-white/10 overflow-hidden">
                        <div
                          className="h-full rounded-full bg-[#c4a747]"
                          style={{ width: `${row.share}%` }}
                        />
                      </div>
                    </div>
                    <span className="text-xs font-medium text-gray-400 w-10 text-right flex-shrink-0">
                      {row.share}%
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
