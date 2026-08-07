'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Wrench } from 'lucide-react';
import { LandlordNavbar } from '@/components/landlord/navigation/LandlordNavbar';
import { LandlordSidebar } from '@/components/landlord/dashboard/LandlordSidebar';
import { MaintenanceRequestCard } from '@/components/landlord/maintenance/MaintenanceRequestCard';
import { AssignVendorModal } from '@/components/landlord/maintenance/AssignVendorModal';
import { ROUTES, isAuthenticated, STORAGE_KEYS, getDashboardRoute } from '@/lib/constants/auth';
import type { LandlordMaintenanceRequest, Vendor } from '@/types/landlord';
import type { MaintenanceRequestStatus } from '@/types/maintenance';

const mockRequests: LandlordMaintenanceRequest[] = [
  {
    id: 'maint_001',
    issueTitle: 'Leaking kitchen faucet',
    category: 'plumbing',
    description:
      'The kitchen faucet has been leaking steadily for two days and is starting to pool water on the counter.',
    priority: 'high',
    status: 'submitted',
    tenantId: 'tenant_003',
    tenantName: 'Chuka Nwosu',
    propertyId: 'prop_001',
    propertyName: 'Sunrise Apartments',
    unitName: 'Unit 3B',
    createdAt: '2026-08-06T09:00:00.000Z',
    updatedAt: '2026-08-06T09:00:00.000Z',
  },
  {
    id: 'maint_002',
    issueTitle: 'AC not cooling',
    category: 'appliances',
    description:
      'Air conditioning unit in the living room is running but not cooling the apartment.',
    priority: 'medium',
    status: 'assigned',
    tenantId: 'tenant_001',
    tenantName: 'Adaeze Okafor',
    propertyId: 'prop_001',
    propertyName: 'Sunrise Apartments',
    unitName: 'Unit 1A',
    assignedVendorId: 'vendor_002',
    assignedVendorName: 'CoolFix HVAC Services',
    createdAt: '2026-08-04T14:00:00.000Z',
    updatedAt: '2026-08-05T10:00:00.000Z',
  },
  {
    id: 'maint_003',
    issueTitle: 'Intercom not working',
    category: 'security',
    description: 'The unit intercom does not ring when visitors buzz from the gate.',
    priority: 'low',
    status: 'in_progress',
    tenantId: 'tenant_004',
    tenantName: 'Ifeoma Bello',
    propertyId: 'prop_002',
    propertyName: 'Palm Court Residences',
    unitName: 'Unit 1A',
    assignedVendorId: 'vendor_003',
    assignedVendorName: 'SecureLine Systems',
    createdAt: '2026-08-02T08:00:00.000Z',
    updatedAt: '2026-08-05T16:00:00.000Z',
  },
  {
    id: 'maint_004',
    issueTitle: 'Power outlet sparking',
    category: 'electrical',
    description:
      'One of the power outlets in the bedroom sparks when a plug is inserted. Tenant has stopped using it.',
    priority: 'urgent',
    status: 'submitted',
    tenantId: 'tenant_006',
    tenantName: 'Ngozi Eze',
    propertyId: 'prop_003',
    propertyName: 'Modern Downtown Loft',
    unitName: 'Unit A',
    createdAt: '2026-08-06T18:00:00.000Z',
    updatedAt: '2026-08-06T18:00:00.000Z',
  },
  {
    id: 'maint_005',
    issueTitle: 'Slow internet speed',
    category: 'internet',
    description: 'Building-wide WiFi has been slower than usual for the past week.',
    priority: 'low',
    status: 'resolved',
    tenantId: 'tenant_002',
    tenantName: 'Tunde Bakare',
    propertyId: 'prop_001',
    propertyName: 'Sunrise Apartments',
    unitName: 'Unit 2B',
    assignedVendorId: 'vendor_004',
    assignedVendorName: 'NetSpeed ISP',
    createdAt: '2026-07-28T10:00:00.000Z',
    updatedAt: '2026-07-30T12:00:00.000Z',
    resolvedAt: '2026-07-30T12:00:00.000Z',
  },
];

const mockVendors: Vendor[] = [
  {
    id: 'vendor_001',
    name: 'AquaFlow Plumbers',
    serviceType: 'Plumbing',
    phone: '+234 803 555 1122',
    rating: 4.8,
    jobsCompleted: 34,
  },
  {
    id: 'vendor_002',
    name: 'CoolFix HVAC Services',
    serviceType: 'Appliances / HVAC',
    phone: '+234 805 555 3344',
    rating: 4.6,
    jobsCompleted: 21,
  },
  {
    id: 'vendor_003',
    name: 'SecureLine Systems',
    serviceType: 'Security',
    phone: '+234 812 555 5566',
    rating: 4.9,
    jobsCompleted: 15,
  },
  {
    id: 'vendor_004',
    name: 'NetSpeed ISP',
    serviceType: 'Internet',
    phone: '+234 701 555 7788',
    rating: 4.3,
    jobsCompleted: 40,
  },
];

const statusFilters: { value: 'all' | MaintenanceRequestStatus; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'submitted', label: 'Submitted' },
  { value: 'assigned', label: 'Assigned' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'resolved', label: 'Resolved' },
];

export default function LandlordMaintenancePage() {
  const router = useRouter();
  const [user, setUser] = useState<{ fullName: string; email: string; role?: string } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [requests, setRequests] = useState<LandlordMaintenanceRequest[]>([]);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [filter, setFilter] = useState<'all' | MaintenanceRequestStatus>('all');
  const [assigningRequest, setAssigningRequest] = useState<LandlordMaintenanceRequest | null>(null);

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
      setRequests(mockRequests);
      setVendors(mockVendors);
      setIsLoading(false);
    };
    checkAuth();
  }, [router]);

  const handleAssignVendor = (requestId: string, vendor: Vendor) => {
    setRequests((prev) =>
      prev.map((r) =>
        r.id === requestId
          ? {
              ...r,
              assignedVendorId: vendor.id,
              assignedVendorName: vendor.name,
              status: 'assigned',
              updatedAt: new Date().toISOString(),
            }
          : r
      )
    );
    setAssigningRequest(null);
  };

  const handleMarkResolved = (id: string) => {
    const now = new Date().toISOString();
    setRequests((prev) =>
      prev.map((r) =>
        r.id === id ? { ...r, status: 'resolved', updatedAt: now, resolvedAt: now } : r
      )
    );
  };

  const handleEscalate = (id: string) => {
    setRequests((prev) =>
      prev.map((r) =>
        r.id === id ? { ...r, priority: 'urgent', updatedAt: new Date().toISOString() } : r
      )
    );
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-[#0a1a1f] flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-[#c4a747] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const filteredRequests = requests.filter((r) => filter === 'all' || r.status === filter);
  const openCount = requests.filter((r) => r.status !== 'resolved').length;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#0a1a1f]">
      <LandlordNavbar user={user} />

      <div className="flex">
        <LandlordSidebar />

        <main className="flex-1 lg:ml-64 mt-16 p-6 lg:p-8">
          <div className="max-w-7xl mx-auto">
            <div className="mb-6">
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Maintenance</h1>
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                {openCount} open ticket{openCount === 1 ? '' : 's'} across your portfolio
              </p>
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

            {filteredRequests.length === 0 ? (
              <div className="bg-white dark:bg-[#1a2a2f] rounded-2xl border border-gray-200 dark:border-white/10 p-12 text-center">
                <Wrench className="w-10 h-10 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
                <p className="text-gray-500 dark:text-gray-400">No maintenance requests found</p>
              </div>
            ) : (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {filteredRequests.map((request, index) => (
                  <MaintenanceRequestCard
                    key={request.id}
                    request={request}
                    delay={index * 0.05}
                    onAssignVendor={setAssigningRequest}
                    onMarkResolved={handleMarkResolved}
                    onEscalate={handleEscalate}
                  />
                ))}
              </div>
            )}
          </div>
        </main>
      </div>

      <AssignVendorModal
        request={assigningRequest}
        vendors={vendors}
        onClose={() => setAssigningRequest(null)}
        onAssign={handleAssignVendor}
      />
    </div>
  );
}
