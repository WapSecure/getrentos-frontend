'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Wallet, Clock, CheckCircle2, TrendingUp, FileSpreadsheet, Check } from 'lucide-react';
import { RealtorNavbar } from '@/components/realtor/navigation/RealtorNavbar';
import { RealtorSidebar } from '@/components/realtor/dashboard/RealtorSidebar';
import { Button } from '@/components/ui/Button';
import { formatCurrency, formatDate } from '@/lib/format';
import { ROUTES, isAuthenticated, STORAGE_KEYS, getDashboardRoute } from '@/lib/constants/auth';
import type { Commission, CommissionStatus } from '@/types/realtor';

const mockCommissions: Commission[] = [
  {
    id: 'comm_001',
    listingTitle: 'Surulere Family Duplex',
    clientName: 'Tobi Fashola',
    dealValue: 54_500_000,
    commissionRate: 5,
    commissionAmount: 2_725_000,
    status: 'paid',
    closedDate: '2026-06-14T00:00:00.000Z',
    paidDate: '2026-06-20T00:00:00.000Z',
  },
  {
    id: 'comm_002',
    listingTitle: 'Modern 2-Bed Flat, Ikeja GRA',
    clientName: 'Emeka Chukwu',
    dealValue: 3_200_000,
    commissionRate: 10,
    commissionAmount: 320_000,
    status: 'invoiced',
    closedDate: '2026-07-30T00:00:00.000Z',
  },
  {
    id: 'comm_003',
    listingTitle: 'Ikeja GRA Townhouse',
    clientName: 'Segun Alabi',
    dealValue: 68_000_000,
    commissionRate: 5,
    commissionAmount: 3_400_000,
    status: 'pending',
    closedDate: '2026-08-05T00:00:00.000Z',
  },
];

const statusConfig: Record<
  CommissionStatus,
  { label: string; icon: React.ElementType; className: string }
> = {
  pending: {
    label: 'Pending',
    icon: Clock,
    className: 'text-yellow-700 bg-yellow-50 dark:text-yellow-400 dark:bg-yellow-900/20',
  },
  invoiced: {
    label: 'Invoiced',
    icon: FileSpreadsheet,
    className: 'text-blue-700 bg-blue-50 dark:text-blue-400 dark:bg-blue-900/20',
  },
  paid: {
    label: 'Paid',
    icon: CheckCircle2,
    className: 'text-green-700 bg-green-50 dark:text-green-400 dark:bg-green-900/20',
  },
};

export default function RealtorCommissionsPage() {
  const router = useRouter();
  const [user, setUser] = useState<{ fullName: string; email: string; role?: string } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [commissions, setCommissions] = useState<Commission[]>([]);
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
        if (parsedUser.role && parsedUser.role !== 'realtor') {
          router.replace(getDashboardRoute(parsedUser.role));
          return;
        }
      }
      setCommissions(mockCommissions);
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

  const totalEarned = commissions.reduce((sum, c) => sum + c.commissionAmount, 0);
  const totalPending = commissions
    .filter((c) => c.status === 'pending')
    .reduce((sum, c) => sum + c.commissionAmount, 0);
  const totalPaid = commissions
    .filter((c) => c.status === 'paid')
    .reduce((sum, c) => sum + c.commissionAmount, 0);
  const dealsClosed = commissions.length;

  const stats = [
    {
      icon: Wallet,
      label: 'Total Earned YTD',
      value: formatCurrency(totalEarned, { compact: true }),
      color: 'gold',
    },
    {
      icon: Clock,
      label: 'Pending',
      value: formatCurrency(totalPending, { compact: true }),
      color: 'blue',
    },
    {
      icon: CheckCircle2,
      label: 'Paid',
      value: formatCurrency(totalPaid, { compact: true }),
      color: 'green',
    },
    { icon: TrendingUp, label: 'Deals Closed', value: dealsClosed, color: 'emerald' },
  ];

  const colorClasses = {
    blue: { bg: 'bg-blue-50 dark:bg-blue-950/20', icon: 'text-blue-600 dark:text-blue-400' },
    gold: { bg: 'bg-[#c4a747]/10', icon: 'text-[#c4a747]' },
    green: { bg: 'bg-green-50 dark:bg-green-950/20', icon: 'text-green-600 dark:text-green-400' },
    emerald: {
      bg: 'bg-emerald-50 dark:bg-emerald-950/20',
      icon: 'text-emerald-600 dark:text-emerald-400',
    },
  } as const;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#0a1a1f]">
      <RealtorNavbar user={user} />

      <div className="flex">
        <RealtorSidebar />

        <main className="flex-1 lg:ml-64 mt-16 p-6 lg:p-8">
          <div className="max-w-7xl mx-auto">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Commissions</h1>
                <p className="text-gray-600 dark:text-gray-400 mt-1">
                  Track earnings from closed deals
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
                const colors = colorClasses[stat.color as keyof typeof colorClasses];
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

            <div className="bg-white dark:bg-[#1a2a2f] rounded-2xl border border-gray-200 dark:border-white/10 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-100 dark:border-white/5 text-left text-xs text-gray-500 dark:text-gray-400">
                      <th className="p-4 font-medium">Listing</th>
                      <th className="p-4 font-medium">Client</th>
                      <th className="p-4 font-medium">Deal Value</th>
                      <th className="p-4 font-medium">Rate</th>
                      <th className="p-4 font-medium">Commission</th>
                      <th className="p-4 font-medium">Status</th>
                      <th className="p-4 font-medium">Closed</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-white/5">
                    {commissions.map((c) => {
                      const status = statusConfig[c.status];
                      const StatusIcon = status.icon;
                      return (
                        <tr
                          key={c.id}
                          className="hover:bg-gray-50 dark:hover:bg-white/5 transition-colors"
                        >
                          <td className="p-4 font-medium text-gray-900 dark:text-white whitespace-nowrap">
                            {c.listingTitle}
                          </td>
                          <td className="p-4 text-gray-600 dark:text-gray-300 whitespace-nowrap">
                            {c.clientName}
                          </td>
                          <td className="p-4 text-gray-600 dark:text-gray-300 whitespace-nowrap">
                            {formatCurrency(c.dealValue, { compact: true })}
                          </td>
                          <td className="p-4 text-gray-600 dark:text-gray-300 whitespace-nowrap">
                            {c.commissionRate}%
                          </td>
                          <td className="p-4 font-bold text-[#c4a747] whitespace-nowrap">
                            {formatCurrency(c.commissionAmount, { compact: true })}
                          </td>
                          <td className="p-4 whitespace-nowrap">
                            <span
                              className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium ${status.className}`}
                            >
                              <StatusIcon className="w-3 h-3" />
                              {status.label}
                            </span>
                          </td>
                          <td className="p-4 text-gray-500 dark:text-gray-400 whitespace-nowrap">
                            {formatDate(c.closedDate)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
