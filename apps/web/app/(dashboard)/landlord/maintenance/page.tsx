'use client';

import { useState } from 'react';
import { Wrench } from 'lucide-react';
import { MaintenanceRequestCard } from '@/components/landlord/maintenance/MaintenanceRequestCard';
import { AssignVendorModal } from '@/components/landlord/maintenance/AssignVendorModal';
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
  const [requests, setRequests] = useState<LandlordMaintenanceRequest[]>(mockRequests);
  const [vendors, setVendors] = useState<Vendor[]>(mockVendors);
  const [filter, setFilter] = useState<'all' | MaintenanceRequestStatus>('all');
  const [assigningRequest, setAssigningRequest] = useState<LandlordMaintenanceRequest | null>(null);

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

  const filteredRequests = requests.filter((r) => filter === 'all' || r.status === filter);
  const openCount = requests.filter((r) => r.status !== 'resolved').length;

  return (
    <>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">Maintenance</h1>
        <p className="text-muted-foreground mt-1">
          {openCount} open ticket{openCount === 1 ? '' : 's'} across your portfolio
        </p>
      </div>

      <div className="flex gap-1 p-1 bg-secondary rounded-lg w-fit mb-6 overflow-x-auto">
        {statusFilters.map((option) => (
          <button
            key={option.value}
            onClick={() => setFilter(option.value)}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors whitespace-nowrap ${
              filter === option.value
                ? 'bg-card text-primary shadow-sm'
                : 'text-muted-foreground hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            {option.label}
          </button>
        ))}
      </div>

      {filteredRequests.length === 0 ? (
        <div className="bg-card rounded-2xl border border-border p-12 text-center">
          <Wrench className="w-10 h-10 text-muted-foreground/50 mx-auto mb-3" />
          <p className="text-muted-foreground">No maintenance requests found</p>
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

      <AssignVendorModal
        request={assigningRequest}
        vendors={vendors}
        onClose={() => setAssigningRequest(null)}
        onAssign={handleAssignVendor}
      />
    </>
  );
}
