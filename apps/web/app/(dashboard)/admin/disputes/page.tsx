'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Search, Gavel } from 'lucide-react';
import { AdminNavbar } from '@/components/admin/navigation/AdminNavbar';
import { AdminSidebar } from '@/components/admin/dashboard/AdminSidebar';
import { DisputeCard } from '@/components/admin/disputes/DisputeCard';
import { DisputeResolutionModal } from '@/components/admin/disputes/DisputeResolutionModal';
import { ROUTES, isAuthenticated, STORAGE_KEYS, getDashboardRoute } from '@/lib/constants/auth';
import type { Dispute, DisputeCategory, DisputeMessage, DisputeStatus } from '@/types/admin';

const mockDisputes: Dispute[] = [
  {
    id: 'dp_001',
    title: 'Escrow release disagreement',
    category: 'escrow',
    raisedBy: 'Tunde Bakare',
    against: 'Lagos Homes Ltd.',
    amount: 45_000_000,
    status: 'open',
    priority: 'high',
    createdAt: '2026-08-04T00:00:00.000Z',
    description:
      'Buyer claims final inspection issues were not resolved before escrow release was requested.',
  },
  {
    id: 'dp_002',
    title: 'Lease renewal terms dispute',
    category: 'lease',
    raisedBy: 'Ngozi Eze',
    against: 'Femi Adeyemi',
    status: 'under_review',
    priority: 'medium',
    createdAt: '2026-08-02T00:00:00.000Z',
    description:
      'Tenant disputes a rent increase applied at renewal that was not disclosed in the original lease.',
  },
  {
    id: 'dp_003',
    title: 'Service quality complaint',
    category: 'service_quality',
    raisedBy: 'Kunle Afolabi',
    against: 'CleanPro Facility Services',
    status: 'escalated',
    priority: 'high',
    createdAt: '2026-07-28T00:00:00.000Z',
    description:
      'Recurring maintenance requests were not addressed within the SLA window over two months.',
  },
  {
    id: 'dp_004',
    title: 'Commission payment delay',
    category: 'payment',
    raisedBy: 'Amaka Obi',
    against: 'GetRentos Platform',
    amount: 850_000,
    status: 'resolved',
    priority: 'low',
    createdAt: '2026-07-15T00:00:00.000Z',
    description: 'Realtor reported a delayed commission payout following a closed sale.',
  },
];

const mockMessages: Record<string, DisputeMessage[]> = {
  dp_001: [
    {
      id: 'msg_001',
      disputeId: 'dp_001',
      senderId: 'party_a',
      senderName: 'Tunde Bakare',
      text: 'The inspection report flagged plumbing issues that were never fixed before I was asked to release funds.',
      timestamp: '2026-08-04T09:00:00.000Z',
    },
    {
      id: 'msg_002',
      disputeId: 'dp_001',
      senderId: 'party_b',
      senderName: 'Lagos Homes Ltd.',
      text: 'We arranged a repair visit on Aug 3rd. The buyer was notified but did not confirm attendance.',
      timestamp: '2026-08-04T11:30:00.000Z',
    },
  ],
  dp_002: [
    {
      id: 'msg_003',
      disputeId: 'dp_002',
      senderId: 'party_a',
      senderName: 'Ngozi Eze',
      text: 'My renewal offer shows a 20% increase with no clause in the original lease permitting this.',
      timestamp: '2026-08-02T08:00:00.000Z',
    },
  ],
  dp_003: [],
  dp_004: [
    {
      id: 'msg_004',
      disputeId: 'dp_004',
      senderId: 'admin',
      senderName: 'GetRentos Admin',
      text: 'Payout has been reprocessed and confirmed as received by the realtor.',
      timestamp: '2026-07-20T00:00:00.000Z',
    },
  ],
};

type StatusFilter = 'all' | DisputeStatus;
type CategoryFilter = 'all' | DisputeCategory;

export default function AdminDisputesPage() {
  const router = useRouter();
  const [user, setUser] = useState<{ fullName: string; email: string; role?: string } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [disputes, setDisputes] = useState<Dispute[]>([]);
  const [messagesByDispute, setMessagesByDispute] = useState<Record<string, DisputeMessage[]>>({});
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>('all');
  const [activeDisputeId, setActiveDisputeId] = useState<string | null>(null);

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
      setDisputes(mockDisputes);
      setMessagesByDispute(mockMessages);
      setIsLoading(false);
    };
    checkAuth();
  }, [router]);

  const activeDispute = disputes.find((d) => d.id === activeDisputeId) || null;

  const handleResolve = (id: string) => {
    setDisputes((prev) => prev.map((d) => (d.id === id ? { ...d, status: 'resolved' } : d)));
  };

  const handleEscalate = (id: string) => {
    setDisputes((prev) => prev.map((d) => (d.id === id ? { ...d, status: 'escalated' } : d)));
  };

  const handleSendMessage = (id: string, text: string) => {
    const newMessage: DisputeMessage = {
      id: `msg_${Date.now()}`,
      disputeId: id,
      senderId: 'admin',
      senderName: 'GetRentos Admin',
      text,
      timestamp: new Date().toISOString(),
    };
    setMessagesByDispute((prev) => ({ ...prev, [id]: [...(prev[id] || []), newMessage] }));
  };

  const filteredDisputes = disputes.filter((d) => {
    const matchesSearch =
      d.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.raisedBy.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.against.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || d.status === statusFilter;
    const matchesCategory = categoryFilter === 'all' || d.category === categoryFilter;
    return matchesSearch && matchesStatus && matchesCategory;
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
    { value: 'open', label: 'Open' },
    { value: 'under_review', label: 'Under Review' },
    { value: 'escalated', label: 'Escalated' },
    { value: 'resolved', label: 'Resolved' },
  ];

  const categoryOptions: { value: CategoryFilter; label: string }[] = [
    { value: 'all', label: 'All Categories' },
    { value: 'escrow', label: 'Escrow' },
    { value: 'lease', label: 'Lease' },
    { value: 'sale', label: 'Sale' },
    { value: 'service_quality', label: 'Service Quality' },
    { value: 'payment', label: 'Payment' },
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#0a1a1f]">
      <AdminNavbar user={user} />

      <div className="flex">
        <AdminSidebar />

        <main className="flex-1 lg:ml-64 mt-16 p-6 lg:p-8">
          <div className="max-w-7xl mx-auto">
            <div className="mb-6">
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                Dispute &amp; Arbitration
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                {disputes.filter((d) => d.status === 'open' || d.status === 'under_review').length}{' '}
                active dispute
                {disputes.filter((d) => d.status === 'open' || d.status === 'under_review')
                  .length === 1
                  ? ''
                  : 's'}{' '}
                requiring attention
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 mb-4">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by title or party..."
                  className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#1a2a2f] text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#c4a747]"
                />
              </div>
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value as CategoryFilter)}
                className="px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#1a2a2f] text-sm text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-[#c4a747] w-fit"
              >
                {categoryOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
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

            {filteredDisputes.length === 0 ? (
              <div className="bg-white dark:bg-[#1a2a2f] rounded-2xl border border-gray-200 dark:border-white/10 p-12 text-center">
                <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-[#c4a747]/10 flex items-center justify-center">
                  <Gavel className="w-8 h-8 text-[#c4a747]" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  No disputes match your filters
                </h3>
              </div>
            ) : (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {filteredDisputes.map((dispute, index) => (
                  <DisputeCard
                    key={dispute.id}
                    dispute={dispute}
                    delay={index * 0.05}
                    onClick={() => setActiveDisputeId(dispute.id)}
                  />
                ))}
              </div>
            )}
          </div>
        </main>
      </div>

      <DisputeResolutionModal
        dispute={activeDispute}
        messages={activeDisputeId ? messagesByDispute[activeDisputeId] || [] : []}
        onClose={() => setActiveDisputeId(null)}
        onResolve={handleResolve}
        onEscalate={handleEscalate}
        onSendMessage={handleSendMessage}
      />
    </div>
  );
}
