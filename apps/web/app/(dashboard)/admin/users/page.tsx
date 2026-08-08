'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Search, Users, CheckCircle2, Clock, ShieldAlert, Ban } from 'lucide-react';
import { AdminNavbar } from '@/components/admin/navigation/AdminNavbar';
import { AdminSidebar } from '@/components/admin/dashboard/AdminSidebar';
import { UserDetailModal } from '@/components/admin/users/UserDetailModal';
import { getInitials, formatDate } from '@/lib/format';
import { ROUTES, isAuthenticated, STORAGE_KEYS, getDashboardRoute } from '@/lib/constants/auth';
import type { PlatformUser, UserAccountStatus, PlatformRole } from '@/types/admin';

const mockUsers: PlatformUser[] = [
  {
    id: 'user_001',
    fullName: 'Adaeze Okafor',
    email: 'adaeze@example.com',
    roles: ['owner', 'landlord'],
    status: 'active',
    trustScore: 92,
    joinedDate: '2025-11-10T00:00:00.000Z',
    lastActiveAt: '2026-08-08T09:00:00.000Z',
  },
  {
    id: 'user_002',
    fullName: 'Chioma Adaobi',
    email: 'chioma@example.com',
    roles: ['buyer'],
    status: 'active',
    trustScore: 82,
    joinedDate: '2026-01-05T00:00:00.000Z',
    lastActiveAt: '2026-08-07T15:00:00.000Z',
  },
  {
    id: 'user_003',
    fullName: 'Chidinma Nwosu',
    email: 'chidinma@example.com',
    roles: ['realtor'],
    status: 'active',
    trustScore: 91,
    joinedDate: '2025-08-14T00:00:00.000Z',
    lastActiveAt: '2026-08-08T08:20:00.000Z',
  },
  {
    id: 'user_004',
    fullName: 'Tunde Bakare',
    email: 'tunde@example.com',
    roles: ['agent'],
    status: 'active',
    trustScore: 89,
    joinedDate: '2025-11-01T00:00:00.000Z',
    lastActiveAt: '2026-08-08T07:00:00.000Z',
  },
  {
    id: 'user_005',
    fullName: 'David Okoro',
    email: 'david@example.com',
    roles: ['renter'],
    status: 'pending',
    trustScore: 62,
    joinedDate: '2026-08-04T00:00:00.000Z',
    lastActiveAt: '2026-08-07T16:00:00.000Z',
  },
  {
    id: 'user_006',
    fullName: 'Blessing Eze',
    email: 'blessing@example.com',
    roles: ['buyer'],
    status: 'suspended',
    trustScore: 45,
    joinedDate: '2026-07-01T00:00:00.000Z',
    lastActiveAt: '2026-08-01T10:00:00.000Z',
  },
];

const statusConfig: Record<
  UserAccountStatus,
  { label: string; icon: React.ElementType; className: string }
> = {
  active: {
    label: 'Active',
    icon: CheckCircle2,
    className: 'text-green-700 bg-green-50 dark:text-green-400 dark:bg-green-900/20',
  },
  pending: {
    label: 'Pending',
    icon: Clock,
    className: 'text-yellow-700 bg-yellow-50 dark:text-yellow-400 dark:bg-yellow-900/20',
  },
  suspended: {
    label: 'Suspended',
    icon: ShieldAlert,
    className: 'text-orange-700 bg-orange-50 dark:text-orange-400 dark:bg-orange-900/20',
  },
  banned: {
    label: 'Banned',
    icon: Ban,
    className: 'text-red-700 bg-red-50 dark:text-red-400 dark:bg-red-900/20',
  },
};

const roleLabels: Record<PlatformRole, string> = {
  renter: 'Renter',
  landlord: 'Landlord',
  owner: 'Owner',
  buyer: 'Buyer',
  realtor: 'Realtor',
  agent: 'Agent',
  admin: 'Admin',
};

type StatusFilter = 'all' | UserAccountStatus;
type RoleFilter = 'all' | PlatformRole;

export default function AdminUsersPage() {
  const router = useRouter();
  const [user, setUser] = useState<{ fullName: string; email: string; role?: string } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [users, setUsers] = useState<PlatformUser[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [roleFilter, setRoleFilter] = useState<RoleFilter>('all');
  const [activeUser, setActiveUser] = useState<PlatformUser | null>(null);

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
      setUsers(mockUsers);
      setIsLoading(false);
    };
    checkAuth();
  }, [router]);

  const handleChangeStatus = (userId: string, status: UserAccountStatus) => {
    setUsers((prev) => prev.map((u) => (u.id === userId ? { ...u, status } : u)));
    setActiveUser(null);
  };

  const filteredUsers = users.filter((u) => {
    const matchesSearch =
      u.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || u.status === statusFilter;
    const matchesRole = roleFilter === 'all' || u.roles.includes(roleFilter);
    return matchesSearch && matchesStatus && matchesRole;
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
    { value: 'active', label: 'Active' },
    { value: 'pending', label: 'Pending' },
    { value: 'suspended', label: 'Suspended' },
    { value: 'banned', label: 'Banned' },
  ];

  const roleOptions: { value: RoleFilter; label: string }[] = [
    { value: 'all', label: 'All Roles' },
    { value: 'renter', label: 'Renter' },
    { value: 'landlord', label: 'Landlord' },
    { value: 'owner', label: 'Owner' },
    { value: 'buyer', label: 'Buyer' },
    { value: 'realtor', label: 'Realtor' },
    { value: 'agent', label: 'Agent' },
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#0a1a1f]">
      <AdminNavbar user={user} />

      <div className="flex">
        <AdminSidebar />

        <main className="flex-1 lg:ml-64 mt-16 p-6 lg:p-8">
          <div className="max-w-7xl mx-auto">
            <div className="mb-6">
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Users</h1>
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                {users.length} user{users.length === 1 ? '' : 's'} across the platform
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 mb-4">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by name or email..."
                  className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#1a2a2f] text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#c4a747]"
                />
              </div>
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value as RoleFilter)}
                className="px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#1a2a2f] text-sm text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-[#c4a747] w-fit"
              >
                {roleOptions.map((option) => (
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

            {filteredUsers.length === 0 ? (
              <div className="bg-white dark:bg-[#1a2a2f] rounded-2xl border border-gray-200 dark:border-white/10 p-12 text-center">
                <Users className="w-10 h-10 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
                <p className="text-gray-500 dark:text-gray-400">No users match your filters</p>
              </div>
            ) : (
              <div className="bg-white dark:bg-[#1a2a2f] rounded-2xl border border-gray-200 dark:border-white/10 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-100 dark:border-white/5 text-left text-xs text-gray-500 dark:text-gray-400">
                        <th className="p-4 font-medium">User</th>
                        <th className="p-4 font-medium">Roles</th>
                        <th className="p-4 font-medium">Trust Score</th>
                        <th className="p-4 font-medium">Status</th>
                        <th className="p-4 font-medium">Joined</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-white/5">
                      {filteredUsers.map((u) => {
                        const status = statusConfig[u.status];
                        const StatusIcon = status.icon;
                        return (
                          <tr
                            key={u.id}
                            className="hover:bg-gray-50 dark:hover:bg-white/5 transition-colors cursor-pointer"
                            onClick={() => setActiveUser(u)}
                          >
                            <td className="p-4">
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-gradient-to-r from-[#c4a747] to-[#e8d5a3] flex items-center justify-center text-[#0a1a1f] font-semibold text-xs flex-shrink-0">
                                  {getInitials(u.fullName)}
                                </div>
                                <div className="min-w-0">
                                  <p className="font-medium text-gray-900 dark:text-white whitespace-nowrap">
                                    {u.fullName}
                                  </p>
                                  <p className="text-xs text-gray-400 truncate">{u.email}</p>
                                </div>
                              </div>
                            </td>
                            <td className="p-4">
                              <div className="flex flex-wrap gap-1">
                                {u.roles.map((role) => (
                                  <span
                                    key={role}
                                    className="text-xs px-2 py-0.5 rounded-full bg-gray-100 dark:bg-white/10 text-gray-600 dark:text-gray-300 whitespace-nowrap"
                                  >
                                    {roleLabels[role]}
                                  </span>
                                ))}
                              </div>
                            </td>
                            <td className="p-4 font-medium text-[#c4a747] whitespace-nowrap">
                              {u.trustScore}
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
                              {formatDate(u.joinedDate)}
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

      <UserDetailModal
        user={activeUser}
        onClose={() => setActiveUser(null)}
        onChangeStatus={handleChangeStatus}
      />
    </div>
  );
}
