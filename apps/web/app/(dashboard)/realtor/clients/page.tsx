'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Search, Users } from 'lucide-react';
import { RealtorNavbar } from '@/components/realtor/navigation/RealtorNavbar';
import { RealtorSidebar } from '@/components/realtor/dashboard/RealtorSidebar';
import { ClientCard } from '@/components/realtor/clients/ClientCard';
import { AddClientModal } from '@/components/realtor/clients/AddClientModal';
import { Button } from '@/components/ui/Button';
import { ROUTES, isAuthenticated, STORAGE_KEYS, getDashboardRoute } from '@/lib/constants/auth';
import type { RealtorClient, ClientRole } from '@/types/realtor';

const mockClients: RealtorClient[] = [
  {
    id: 'client_001',
    clientName: 'Adaeze Okafor',
    role: 'owner',
    email: 'adaeze@example.com',
    phone: '+234 803 555 0101',
    status: 'active',
    propertiesRepresented: 3,
    joinedDate: '2025-11-10T00:00:00.000Z',
  },
  {
    id: 'client_002',
    clientName: 'Emeka Chukwu',
    role: 'landlord',
    email: 'emeka@example.com',
    phone: '+234 802 444 7781',
    status: 'active',
    propertiesRepresented: 5,
    joinedDate: '2025-09-02T00:00:00.000Z',
  },
  {
    id: 'client_003',
    clientName: 'Chioma Adaobi',
    role: 'owner',
    email: 'chioma@example.com',
    phone: '+234 701 233 9090',
    status: 'pending',
    propertiesRepresented: 1,
    joinedDate: '2026-07-28T00:00:00.000Z',
  },
];

type RoleFilter = 'all' | ClientRole;

export default function RealtorClientsPage() {
  const router = useRouter();
  const [user, setUser] = useState<{ fullName: string; email: string; role?: string } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [clients, setClients] = useState<RealtorClient[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState<RoleFilter>('all');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

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
      setClients(mockClients);
      setIsLoading(false);
    };
    checkAuth();
  }, [router]);

  const handleAddClient = (
    data: Omit<RealtorClient, 'id' | 'status' | 'propertiesRepresented' | 'joinedDate'>
  ) => {
    const newClient: RealtorClient = {
      ...data,
      id: `client_${Date.now()}`,
      status: 'pending',
      propertiesRepresented: 0,
      joinedDate: new Date().toISOString(),
    };
    setClients((prev) => [newClient, ...prev]);
  };

  const filteredClients = clients.filter((c) => {
    const matchesSearch = c.clientName.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = filter === 'all' || c.role === filter;
    return matchesSearch && matchesFilter;
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-[#0a1a1f] flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-[#c4a747] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const filterOptions: { value: RoleFilter; label: string }[] = [
    { value: 'all', label: 'All' },
    { value: 'owner', label: 'Owners' },
    { value: 'landlord', label: 'Landlords' },
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#0a1a1f]">
      <RealtorNavbar user={user} />

      <div className="flex">
        <RealtorSidebar />

        <main className="flex-1 lg:ml-64 mt-16 p-6 lg:p-8">
          <div className="max-w-7xl mx-auto">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Clients</h1>
                <p className="text-gray-600 dark:text-gray-400 mt-1">
                  {clients.length} client{clients.length === 1 ? '' : 's'} you represent
                </p>
              </div>
              <Button variant="primary" className="gap-2" onClick={() => setIsAddModalOpen(true)}>
                <Plus className="w-4 h-4" />
                Add Client
              </Button>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 mb-6">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search clients..."
                  className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#1a2a2f] text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#c4a747]"
                />
              </div>
              <div className="flex gap-1 p-1 bg-gray-100 dark:bg-white/10 rounded-lg w-fit">
                {filterOptions.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => setFilter(option.value)}
                    className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors whitespace-nowrap ${
                      filter === option.value
                        ? 'bg-white dark:bg-[#1a2a2f] text-[#c4a747] shadow-sm'
                        : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>

            {filteredClients.length === 0 ? (
              <div className="bg-white dark:bg-[#1a2a2f] rounded-2xl border border-gray-200 dark:border-white/10 p-12 text-center">
                <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-[#c4a747]/10 flex items-center justify-center">
                  <Users className="w-8 h-8 text-[#c4a747]" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  {clients.length === 0 ? 'No clients yet' : 'No clients match your filters'}
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 max-w-sm mx-auto">
                  {clients.length === 0
                    ? 'Add an owner or landlord client to start representing their properties.'
                    : 'Try adjusting your search or filter.'}
                </p>
                {clients.length === 0 && (
                  <Button
                    variant="primary"
                    className="mt-6"
                    onClick={() => setIsAddModalOpen(true)}
                  >
                    Add Your First Client
                  </Button>
                )}
              </div>
            ) : (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {filteredClients.map((client, index) => (
                  <ClientCard
                    key={client.id}
                    client={client}
                    delay={index * 0.05}
                    onMessage={() => router.push(`/realtor/messages?client=${client.id}`)}
                  />
                ))}
              </div>
            )}
          </div>
        </main>
      </div>

      <AddClientModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSubmit={handleAddClient}
      />
    </div>
  );
}
