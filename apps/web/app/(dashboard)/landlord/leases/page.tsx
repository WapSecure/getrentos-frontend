'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, FileCheck } from 'lucide-react';
import { LandlordNavbar } from '@/components/landlord/navigation/LandlordNavbar';
import { LandlordSidebar } from '@/components/landlord/dashboard/LandlordSidebar';
import { LeaseCard } from '@/components/landlord/leases/LeaseCard';
import { CreateLeaseModal } from '@/components/landlord/leases/CreateLeaseModal';
import { RenewalOfferModal } from '@/components/landlord/leases/RenewalOfferModal';
import { Button } from '@/components/ui/Button';
import { ROUTES, isAuthenticated, STORAGE_KEYS, getDashboardRoute } from '@/lib/constants/auth';
import type { Lease, LeaseStatus, Unit } from '@/types/landlord';

const mockLeases: Lease[] = [
  {
    id: 'lease_001',
    tenantId: 'tenant_001',
    tenantName: 'Adaeze Okafor',
    propertyId: 'prop_001',
    propertyName: 'Sunrise Apartments',
    unitId: 'unit_001',
    unitName: 'Unit 1A',
    leaseStart: '2025-02-01',
    leaseEnd: '2027-01-31',
    rentAmount: 450_000,
    securityDeposit: 450_000,
    status: 'signed',
    createdAt: '2025-01-20T00:00:00.000Z',
  },
  {
    id: 'lease_003',
    tenantId: 'tenant_003',
    tenantName: 'Chuka Nwosu',
    propertyId: 'prop_001',
    propertyName: 'Sunrise Apartments',
    unitId: 'unit_003',
    unitName: 'Unit 3B',
    leaseStart: '2024-11-10',
    leaseEnd: '2026-08-21',
    rentAmount: 450_000,
    securityDeposit: 450_000,
    status: 'signed',
    createdAt: '2024-11-01T00:00:00.000Z',
  },
  {
    id: 'lease_004',
    tenantId: 'tenant_004',
    tenantName: 'Ifeoma Bello',
    propertyId: 'prop_002',
    propertyName: 'Palm Court Residences',
    unitId: 'unit_005',
    unitName: 'Unit 1A',
    leaseStart: '2025-06-01',
    leaseEnd: '2026-05-31',
    rentAmount: 580_000,
    securityDeposit: 580_000,
    status: 'signed',
    createdAt: '2025-05-20T00:00:00.000Z',
  },
  {
    id: 'lease_005',
    tenantId: 'tenant_005',
    tenantName: 'Segun Adeyemi',
    propertyId: 'prop_002',
    propertyName: 'Palm Court Residences',
    unitId: 'unit_006',
    unitName: 'Unit 1B',
    leaseStart: '2024-08-20',
    leaseEnd: '2025-08-19',
    rentAmount: 580_000,
    status: 'expired',
    createdAt: '2024-08-10T00:00:00.000Z',
  },
];

const mockVacantUnits: Unit[] = [
  {
    id: 'unit_007',
    propertyId: 'prop_002',
    propertyName: 'Palm Court Residences',
    unitName: 'Unit 2A',
    bedrooms: 2,
    bathrooms: 2,
    monthlyRent: 460_000,
    occupancyStatus: 'vacant',
  },
  {
    id: 'unit_009',
    propertyId: 'prop_003',
    propertyName: 'Modern Downtown Loft',
    unitName: 'Unit B',
    bedrooms: 1,
    bathrooms: 1,
    monthlyRent: 450_000,
    occupancyStatus: 'vacant',
  },
];

const statusFilters: { value: 'all' | LeaseStatus; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'signed', label: 'Active' },
  { value: 'sent', label: 'Sent' },
  { value: 'draft', label: 'Draft' },
  { value: 'expired', label: 'Expired' },
];

export default function LandlordLeasesPage() {
  const router = useRouter();
  const [user, setUser] = useState<{ fullName: string; email: string; role?: string } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [leases, setLeases] = useState<Lease[]>([]);
  const [vacantUnits, setVacantUnits] = useState<Unit[]>([]);
  const [filter, setFilter] = useState<'all' | LeaseStatus>('all');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [renewingLease, setRenewingLease] = useState<Lease | null>(null);

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
        if (parsedUser.role && parsedUser.role !== 'landlord') {
          router.replace(getDashboardRoute(parsedUser.role));
          return;
        }
      }
      setLeases(mockLeases);
      setVacantUnits(mockVacantUnits);
      setIsLoading(false);
    };
    checkAuth();
  }, [router]);

  const handleCreateLease = (
    data: Omit<Lease, 'id' | 'status' | 'createdAt'>,
    sendImmediately: boolean
  ) => {
    const newLease: Lease = {
      ...data,
      id: `lease_${Date.now()}`,
      status: sendImmediately ? 'sent' : 'draft',
      createdAt: new Date().toISOString(),
    };
    setLeases((prev) => [newLease, ...prev]);
    setVacantUnits((prev) => prev.filter((u) => u.id !== data.unitId));
  };

  const handleSendLease = (id: string) => {
    setLeases((prev) => prev.map((l) => (l.id === id ? { ...l, status: 'sent' } : l)));
  };

  const handleSendRenewalOffer = (leaseId: string, newRent: number, newEndDate: string) => {
    setLeases((prev) =>
      prev.map((l) =>
        l.id === leaseId ? { ...l, rentAmount: newRent, leaseEnd: newEndDate, status: 'sent' } : l
      )
    );
    setRenewingLease(null);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-[#0a1a1f] flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-[#c4a747] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const filteredLeases = leases.filter((l) => filter === 'all' || l.status === filter);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#0a1a1f]">
      <LandlordNavbar user={user} />

      <div className="flex">
        <LandlordSidebar />

        <main className="flex-1 lg:ml-64 mt-16 p-6 lg:p-8">
          <div className="max-w-7xl mx-auto">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Leases</h1>
                <p className="text-gray-600 dark:text-gray-400 mt-1">
                  {leases.filter((l) => l.status === 'signed').length} active lease
                  {leases.filter((l) => l.status === 'signed').length === 1 ? '' : 's'}
                </p>
              </div>
              <Button
                variant="primary"
                className="gap-2"
                onClick={() => setIsCreateModalOpen(true)}
              >
                <Plus className="w-4 h-4" />
                Create Lease
              </Button>
            </div>

            <div className="flex gap-1 p-1 bg-gray-100 dark:bg-white/10 rounded-lg w-fit mb-6 overflow-x-auto">
              {statusFilters.map((option) => (
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

            {filteredLeases.length === 0 ? (
              <div className="bg-white dark:bg-[#1a2a2f] rounded-2xl border border-gray-200 dark:border-white/10 p-12 text-center">
                <FileCheck className="w-10 h-10 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
                <p className="text-gray-500 dark:text-gray-400">No leases found</p>
              </div>
            ) : (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {filteredLeases.map((lease, index) => (
                  <LeaseCard
                    key={lease.id}
                    lease={lease}
                    delay={index * 0.05}
                    onSendLease={handleSendLease}
                    onRequestRenewal={setRenewingLease}
                  />
                ))}
              </div>
            )}
          </div>
        </main>
      </div>

      <CreateLeaseModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        vacantUnits={vacantUnits}
        onSave={handleCreateLease}
      />

      <RenewalOfferModal
        key={renewingLease?.id ?? 'none'}
        lease={renewingLease}
        onClose={() => setRenewingLease(null)}
        onSend={handleSendRenewalOffer}
      />
    </div>
  );
}
