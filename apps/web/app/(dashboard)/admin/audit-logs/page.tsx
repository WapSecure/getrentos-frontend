'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Search, ScrollText } from 'lucide-react';
import { AdminNavbar } from '@/components/admin/navigation/AdminNavbar';
import { AdminSidebar } from '@/components/admin/dashboard/AdminSidebar';
import { ROUTES, isAuthenticated, STORAGE_KEYS, getDashboardRoute } from '@/lib/constants/auth';
import { formatDate } from '@/lib/format';
import type { AuditLogEntry, AuditSeverity } from '@/types/admin';

const mockLogs: AuditLogEntry[] = [
  {
    id: 'log_001',
    actorName: 'GetRentos Admin',
    actorRole: 'admin',
    action: 'Suspended user account',
    target: 'Blessing Umeh (renter)',
    severity: 'warning',
    timestamp: '2026-08-07T15:10:00.000Z',
    ipAddress: '197.210.54.12',
  },
  {
    id: 'log_002',
    actorName: 'Segun Alabi',
    actorRole: 'owner',
    action: 'Updated property listing',
    target: 'Ikeja GRA Townhouse',
    severity: 'info',
    timestamp: '2026-08-07T10:22:00.000Z',
    ipAddress: '105.112.8.44',
  },
  {
    id: 'log_003',
    actorName: 'GetRentos Admin',
    actorRole: 'admin',
    action: 'Froze escrow transaction',
    target: 'Port Harcourt GRA Bungalow (ESC-006)',
    severity: 'critical',
    timestamp: '2026-08-06T18:40:00.000Z',
    ipAddress: '197.210.54.12',
  },
  {
    id: 'log_004',
    actorName: 'Chidinma Nwosu',
    actorRole: 'realtor',
    action: 'Submitted license verification',
    target: 'Real Estate Agent License',
    severity: 'info',
    timestamp: '2026-08-05T09:05:00.000Z',
    ipAddress: '102.89.33.71',
  },
  {
    id: 'log_005',
    actorName: 'GetRentos Admin',
    actorRole: 'admin',
    action: 'Approved property verification',
    target: 'Sunrise Apartments',
    severity: 'info',
    timestamp: '2026-08-04T13:15:00.000Z',
    ipAddress: '197.210.54.12',
  },
  {
    id: 'log_006',
    actorName: 'Ibrahim Musa',
    actorRole: 'landlord',
    action: 'Changed payout bank account',
    target: 'Payout Settings',
    severity: 'warning',
    timestamp: '2026-08-03T11:00:00.000Z',
    ipAddress: '105.118.20.6',
  },
];

const severityConfig: Record<AuditSeverity, { label: string; className: string }> = {
  info: {
    label: 'Info',
    className: 'text-blue-700 bg-blue-50 dark:text-blue-400 dark:bg-blue-900/20',
  },
  warning: {
    label: 'Warning',
    className: 'text-yellow-700 bg-yellow-50 dark:text-yellow-400 dark:bg-yellow-900/20',
  },
  critical: {
    label: 'Critical',
    className: 'text-red-700 bg-red-50 dark:text-red-400 dark:bg-red-900/20',
  },
};

type SeverityFilter = 'all' | AuditSeverity;

export default function AdminAuditLogsPage() {
  const router = useRouter();
  const [user, setUser] = useState<{ fullName: string; email: string; role?: string } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
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
      setLogs(mockLogs);
      setIsLoading(false);
    };
    checkAuth();
  }, [router]);

  const filteredLogs = logs.filter((l) => {
    const matchesSearch =
      l.actorName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      l.action.toLowerCase().includes(searchQuery.toLowerCase()) ||
      l.target.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesSeverity = severityFilter === 'all' || l.severity === severityFilter;
    return matchesSearch && matchesSeverity;
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-[#0a1a1f] flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-[#c4a747] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const severityOptions: { value: SeverityFilter; label: string }[] = [
    { value: 'all', label: 'All' },
    { value: 'critical', label: 'Critical' },
    { value: 'warning', label: 'Warning' },
    { value: 'info', label: 'Info' },
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#0a1a1f]">
      <AdminNavbar user={user} />

      <div className="flex">
        <AdminSidebar />

        <main className="flex-1 lg:ml-64 mt-16 p-6 lg:p-8">
          <div className="max-w-7xl mx-auto">
            <div className="mb-6">
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Audit Logs</h1>
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                A record of sensitive actions taken across the platform
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 mb-4">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by actor, action, or target..."
                  className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#1a2a2f] text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#c4a747]"
                />
              </div>
            </div>

            <div className="flex gap-1 p-1 bg-gray-100 dark:bg-white/10 rounded-lg w-fit overflow-x-auto mb-6">
              {severityOptions.map((option) => (
                <button
                  key={option.value}
                  onClick={() => setSeverityFilter(option.value)}
                  className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors whitespace-nowrap ${
                    severityFilter === option.value
                      ? 'bg-white dark:bg-[#1a2a2f] text-[#c4a747] shadow-sm'
                      : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>

            {filteredLogs.length === 0 ? (
              <div className="bg-white dark:bg-[#1a2a2f] rounded-2xl border border-gray-200 dark:border-white/10 p-12 text-center">
                <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-[#c4a747]/10 flex items-center justify-center">
                  <ScrollText className="w-8 h-8 text-[#c4a747]" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  No log entries match your filters
                </h3>
              </div>
            ) : (
              <div className="bg-white dark:bg-[#1a2a2f] rounded-2xl border border-gray-200 dark:border-white/10 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-200 dark:border-white/10 text-left text-xs text-gray-500 dark:text-gray-400">
                        <th className="px-4 py-3 font-medium">Actor</th>
                        <th className="px-4 py-3 font-medium">Action</th>
                        <th className="px-4 py-3 font-medium">Target</th>
                        <th className="px-4 py-3 font-medium">Severity</th>
                        <th className="px-4 py-3 font-medium">IP Address</th>
                        <th className="px-4 py-3 font-medium">Timestamp</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-white/5">
                      {filteredLogs.map((log) => {
                        const severity = severityConfig[log.severity];
                        return (
                          <tr key={log.id}>
                            <td className="px-4 py-3 whitespace-nowrap">
                              <p className="font-medium text-gray-900 dark:text-white">
                                {log.actorName}
                              </p>
                              <p className="text-xs text-gray-400 capitalize">{log.actorRole}</p>
                            </td>
                            <td className="px-4 py-3 text-gray-600 dark:text-gray-300 whitespace-nowrap">
                              {log.action}
                            </td>
                            <td className="px-4 py-3 text-gray-600 dark:text-gray-300 whitespace-nowrap">
                              {log.target}
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap">
                              <span
                                className={`inline-flex items-center text-xs px-2 py-0.5 rounded-full font-medium ${severity.className}`}
                              >
                                {severity.label}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-gray-500 dark:text-gray-400 whitespace-nowrap font-mono text-xs">
                              {log.ipAddress}
                            </td>
                            <td className="px-4 py-3 text-gray-500 dark:text-gray-400 whitespace-nowrap">
                              {formatDate(log.timestamp)}
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
