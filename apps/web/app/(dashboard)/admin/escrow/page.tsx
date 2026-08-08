'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Search, Landmark, Flag } from 'lucide-react';
import { AdminNavbar } from '@/components/admin/navigation/AdminNavbar';
import { AdminSidebar } from '@/components/admin/dashboard/AdminSidebar';
import { ROUTES, isAuthenticated, STORAGE_KEYS, getDashboardRoute } from '@/lib/constants/auth';
import { formatCurrency, formatDate } from '@/lib/format';
import type { PlatformEscrowStatus, PlatformEscrowTransaction } from '@/types/admin';

const mockTransactions: PlatformEscrowTransaction[] = [
  {
    id: 'esc_001',
    propertyTitle: 'Lekki Waterfront Villa',
    buyerName: 'Tunde Bakare',
    sellerName: 'Lagos Homes Ltd.',
    amount: 145_000_000,
    status: 'deposit_pending',
    createdAt: '2026-08-06T00:00:00.000Z',
    flagged: false,
  },
  {
    id: 'esc_002',
    propertyTitle: 'Ikoyi Court Duplex',
    buyerName: 'Grace Adigun',
    sellerName: 'Femi Adeyemi',
    amount: 98_500_000,
    status: 'funds_held',
    createdAt: '2026-08-04T00:00:00.000Z',
    flagged: true,
  },
  {
    id: 'esc_003',
    propertyTitle: 'Abuja Maitama Terrace',
    buyerName: 'Chidinma Nwosu',
    sellerName: 'Prime Realty Partners',
    amount: 210_000_000,
    status: 'verification',
    createdAt: '2026-08-02T00:00:00.000Z',
    flagged: false,
  },
  {
    id: 'esc_004',
    propertyTitle: 'Victoria Island Penthouse',
    buyerName: 'Kunle Afolabi',
    sellerName: 'Segun Alabi',
    amount: 320_000_000,
    status: 'final_payment',
    createdAt: '2026-07-28T00:00:00.000Z',
    flagged: false,
  },
  {
    id: 'esc_005',
    propertyTitle: 'Enugu Independence Layout',
    buyerName: 'Amaka Obi',
    sellerName: 'Ibrahim Musa',
    amount: 62_000_000,
    status: 'released',
    createdAt: '2026-07-20T00:00:00.000Z',
    flagged: false,
  },
  {
    id: 'esc_006',
    propertyTitle: 'Port Harcourt GRA Bungalow',
    buyerName: 'David Okoro',
    sellerName: 'Ngozi Eze',
    amount: 54_000_000,
    status: 'frozen',
    createdAt: '2026-07-15T00:00:00.000Z',
    flagged: true,
  },
];

const statusConfig: Record<PlatformEscrowStatus, { label: string; className: string }> = {
  deposit_pending: {
    label: 'Deposit Pending',
    className: 'text-gray-600 bg-gray-100 dark:text-gray-300 dark:bg-white/10',
  },
  funds_held: {
    label: 'Funds Held',
    className: 'text-blue-700 bg-blue-50 dark:text-blue-400 dark:bg-blue-900/20',
  },
  verification: {
    label: 'Verification',
    className: 'text-yellow-700 bg-yellow-50 dark:text-yellow-400 dark:bg-yellow-900/20',
  },
  final_payment: {
    label: 'Final Payment',
    className: 'text-purple-700 bg-purple-50 dark:text-purple-400 dark:bg-purple-900/20',
  },
  released: {
    label: 'Released',
    className: 'text-green-700 bg-green-50 dark:text-green-400 dark:bg-green-900/20',
  },
  frozen: {
    label: 'Frozen',
    className: 'text-red-700 bg-red-50 dark:text-red-400 dark:bg-red-900/20',
  },
};

type StatusFilter = 'all' | PlatformEscrowStatus;

export default function AdminEscrowPage() {
  const router = useRouter();
  const [user, setUser] = useState<{ fullName: string; email: string; role?: string } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [transactions, setTransactions] = useState<PlatformEscrowTransaction[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');

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
      setTransactions(mockTransactions);
      setIsLoading(false);
    };
    checkAuth();
  }, [router]);

  const toggleFlag = (id: string) => {
    setTransactions((prev) => prev.map((t) => (t.id === id ? { ...t, flagged: !t.flagged } : t)));
  };

  const filteredTransactions = transactions.filter((t) => {
    const matchesSearch =
      t.propertyTitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.buyerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.sellerName.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || t.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-[#0a1a1f] flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-[#c4a747] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const statusOptions: { value: StatusFilter; label: string }[] = [
    { value: 'all', label: 'All' },
    { value: 'deposit_pending', label: 'Deposit Pending' },
    { value: 'funds_held', label: 'Funds Held' },
    { value: 'verification', label: 'Verification' },
    { value: 'final_payment', label: 'Final Payment' },
    { value: 'released', label: 'Released' },
    { value: 'frozen', label: 'Frozen' },
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#0a1a1f]">
      <AdminNavbar user={user} />

      <div className="flex">
        <AdminSidebar />

        <main className="flex-1 lg:ml-64 mt-16 p-6 lg:p-8">
          <div className="max-w-7xl mx-auto">
            <div className="mb-6">
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Escrow Oversight</h1>
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                Platform-wide monitoring of escrow transactions ·{' '}
                {transactions.filter((t) => t.flagged).length} flagged for review
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 mb-4">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by property, buyer, or seller..."
                  className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#1a2a2f] text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#c4a747]"
                />
              </div>
            </div>

            <div className="flex gap-1 p-1 bg-gray-100 dark:bg-white/10 rounded-lg w-fit overflow-x-auto mb-6">
              {statusOptions.map((option) => (
                <button
                  key={option.value}
                  onClick={() => setStatusFilter(option.value)}
                  className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors whitespace-nowrap ${
                    statusFilter === option.value
                      ? 'bg-white dark:bg-[#1a2a2f] text-[#c4a747] shadow-sm'
                      : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>

            {filteredTransactions.length === 0 ? (
              <div className="bg-white dark:bg-[#1a2a2f] rounded-2xl border border-gray-200 dark:border-white/10 p-12 text-center">
                <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-[#c4a747]/10 flex items-center justify-center">
                  <Landmark className="w-8 h-8 text-[#c4a747]" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  No transactions match your filters
                </h3>
              </div>
            ) : (
              <div className="bg-white dark:bg-[#1a2a2f] rounded-2xl border border-gray-200 dark:border-white/10 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-200 dark:border-white/10 text-left text-xs text-gray-500 dark:text-gray-400">
                        <th className="px-4 py-3 font-medium">Property</th>
                        <th className="px-4 py-3 font-medium">Buyer</th>
                        <th className="px-4 py-3 font-medium">Seller</th>
                        <th className="px-4 py-3 font-medium">Amount</th>
                        <th className="px-4 py-3 font-medium">Status</th>
                        <th className="px-4 py-3 font-medium">Created</th>
                        <th className="px-4 py-3 font-medium text-right">Flag</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-white/5">
                      {filteredTransactions.map((t) => {
                        const status = statusConfig[t.status];
                        return (
                          <tr
                            key={t.id}
                            className={t.flagged ? 'bg-red-50/50 dark:bg-red-900/10' : ''}
                          >
                            <td className="px-4 py-3 font-medium text-gray-900 dark:text-white whitespace-nowrap">
                              {t.propertyTitle}
                            </td>
                            <td className="px-4 py-3 text-gray-600 dark:text-gray-300 whitespace-nowrap">
                              {t.buyerName}
                            </td>
                            <td className="px-4 py-3 text-gray-600 dark:text-gray-300 whitespace-nowrap">
                              {t.sellerName}
                            </td>
                            <td className="px-4 py-3 text-gray-900 dark:text-white whitespace-nowrap">
                              {formatCurrency(t.amount, { compact: true })}
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap">
                              <span
                                className={`inline-flex items-center text-xs px-2 py-0.5 rounded-full font-medium ${status.className}`}
                              >
                                {status.label}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-gray-500 dark:text-gray-400 whitespace-nowrap">
                              {formatDate(t.createdAt)}
                            </td>
                            <td className="px-4 py-3 text-right">
                              <button
                                onClick={() => toggleFlag(t.id)}
                                className={`p-1.5 rounded-lg transition-colors ${
                                  t.flagged
                                    ? 'text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-900/30'
                                    : 'text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-gray-100 dark:hover:bg-white/10'
                                }`}
                                title={t.flagged ? 'Unflag transaction' : 'Flag for review'}
                              >
                                <Flag className="w-3.5 h-3.5" />
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
