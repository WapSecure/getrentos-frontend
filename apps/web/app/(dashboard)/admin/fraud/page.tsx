'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Search, ShieldAlert } from 'lucide-react';
import { AdminNavbar } from '@/components/admin/navigation/AdminNavbar';
import { AdminSidebar } from '@/components/admin/dashboard/AdminSidebar';
import { FraudAlertCard } from '@/components/admin/fraud/FraudAlertCard';
import { ROUTES, isAuthenticated, STORAGE_KEYS, getDashboardRoute } from '@/lib/constants/auth';
import type { FraudAlert, FraudAlertSeverity, FraudAlertStatus } from '@/types/admin';

const mockAlerts: FraudAlert[] = [
  {
    id: 'fa_001',
    subjectName: 'Blessing Umeh',
    subjectRole: 'renter',
    reason:
      'Multiple rental applications submitted with mismatched identity documents across sessions.',
    severity: 'critical',
    status: 'flagged',
    detectedAt: '2026-08-07T14:00:00.000Z',
    relatedEntity: 'Application #APP-4521',
  },
  {
    id: 'fa_002',
    subjectName: 'Prime Realty Partners',
    subjectRole: 'agent',
    reason: 'Unusual pattern of commission claims across listings not assigned to this agent.',
    severity: 'high',
    status: 'investigating',
    detectedAt: '2026-08-06T10:30:00.000Z',
    relatedEntity: 'Commission Batch #CB-118',
  },
  {
    id: 'fa_003',
    subjectName: 'Ibrahim Musa',
    subjectRole: 'landlord',
    reason: 'Bank account on file changed twice within 48 hours prior to a large payout request.',
    severity: 'high',
    status: 'flagged',
    detectedAt: '2026-08-05T18:15:00.000Z',
    relatedEntity: 'Payout #PO-9902',
  },
  {
    id: 'fa_004',
    subjectName: 'Grace Adigun',
    subjectRole: 'buyer',
    reason: 'Escrow deposit source flagged by payment processor for review.',
    severity: 'medium',
    status: 'cleared',
    detectedAt: '2026-07-30T09:00:00.000Z',
    relatedEntity: 'Escrow #ESC-3312',
  },
  {
    id: 'fa_005',
    subjectName: 'Victor Eze',
    subjectRole: 'realtor',
    reason: 'Listing photos reused across multiple unrelated property listings.',
    severity: 'low',
    status: 'confirmed',
    detectedAt: '2026-07-22T12:00:00.000Z',
    relatedEntity: 'Listing #LST-7765',
  },
];

type StatusFilter = 'all' | FraudAlertStatus;
type SeverityFilter = 'all' | FraudAlertSeverity;

export default function AdminFraudPage() {
  const router = useRouter();
  const [user, setUser] = useState<{ fullName: string; email: string; role?: string } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [alerts, setAlerts] = useState<FraudAlert[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [severityFilter, setSeverityFilter] = useState<SeverityFilter>('all');

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
      setAlerts(mockAlerts);
      setIsLoading(false);
    };
    checkAuth();
  }, [router]);

  const updateStatus = (id: string, status: FraudAlertStatus) => {
    setAlerts((prev) => prev.map((a) => (a.id === id ? { ...a, status } : a)));
  };

  const filteredAlerts = alerts.filter((a) => {
    const matchesSearch =
      a.subjectName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.relatedEntity.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || a.status === statusFilter;
    const matchesSeverity = severityFilter === 'all' || a.severity === severityFilter;
    return matchesSearch && matchesStatus && matchesSeverity;
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
    { value: 'flagged', label: 'Flagged' },
    { value: 'investigating', label: 'Investigating' },
    { value: 'cleared', label: 'Cleared' },
    { value: 'confirmed', label: 'Confirmed' },
  ];

  const severityOptions: { value: SeverityFilter; label: string }[] = [
    { value: 'all', label: 'All Severities' },
    { value: 'critical', label: 'Critical' },
    { value: 'high', label: 'High' },
    { value: 'medium', label: 'Medium' },
    { value: 'low', label: 'Low' },
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
                Fraud &amp; Risk Review
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                {alerts.filter((a) => a.status === 'flagged').length} alert
                {alerts.filter((a) => a.status === 'flagged').length === 1 ? '' : 's'} awaiting
                triage
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 mb-4">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by subject or entity..."
                  className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#1a2a2f] text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#c4a747]"
                />
              </div>
              <select
                value={severityFilter}
                onChange={(e) => setSeverityFilter(e.target.value as SeverityFilter)}
                className="px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#1a2a2f] text-sm text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-[#c4a747] w-fit"
              >
                {severityOptions.map((option) => (
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

            {filteredAlerts.length === 0 ? (
              <div className="bg-white dark:bg-[#1a2a2f] rounded-2xl border border-gray-200 dark:border-white/10 p-12 text-center">
                <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-[#c4a747]/10 flex items-center justify-center">
                  <ShieldAlert className="w-8 h-8 text-[#c4a747]" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  No alerts match your filters
                </h3>
              </div>
            ) : (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {filteredAlerts.map((alert, index) => (
                  <FraudAlertCard
                    key={alert.id}
                    alert={alert}
                    delay={index * 0.05}
                    onInvestigate={() => updateStatus(alert.id, 'investigating')}
                    onClear={() => updateStatus(alert.id, 'cleared')}
                    onConfirm={() => updateStatus(alert.id, 'confirmed')}
                  />
                ))}
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
