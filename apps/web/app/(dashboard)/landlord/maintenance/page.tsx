'use client';

import { useState, useEffect } from 'react';
import { Wrench } from 'lucide-react';
import { MaintenanceRequestCard } from '@/components/landlord/maintenance/MaintenanceRequestCard';
import { AssignVendorModal } from '@/components/landlord/maintenance/AssignVendorModal';
import { landlordService } from '@/services/landlordService';
import type { LandlordMaintenanceRequest, Vendor } from '@/types/landlord';
import type { MaintenanceRequestStatus } from '@/types/maintenance';

const statusFilters: { value: 'all' | MaintenanceRequestStatus; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'submitted', label: 'Submitted' },
  { value: 'assigned', label: 'Assigned' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'resolved', label: 'Resolved' },
];

export default function LandlordMaintenancePage() {
  const [requests, setRequests] = useState<LandlordMaintenanceRequest[]>([]);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [filter, setFilter] = useState<'all' | MaintenanceRequestStatus>('all');
  const [assigningRequest, setAssigningRequest] = useState<LandlordMaintenanceRequest | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      const [requestsRes, vendorsRes] = await Promise.all([
        landlordService.listMaintenanceRequests(),
        landlordService.listVendors(),
      ]);
      if (requestsRes.success && requestsRes.data) setRequests(requestsRes.data);
      if (vendorsRes.success && vendorsRes.data) setVendors(vendorsRes.data);
    };

    fetchData();
  }, []);

  const handleAssignVendor = async (requestId: string, vendor: Vendor) => {
    const response = await landlordService.assignMaintenanceVendor(requestId, vendor.id);
    if (response.success && response.data) {
      setRequests((prev) => prev.map((r) => (r.id === requestId ? response.data! : r)));
    }
    setAssigningRequest(null);
  };

  const handleMarkResolved = async (id: string) => {
    const response = await landlordService.markMaintenanceResolved(id);
    if (response.success && response.data) {
      setRequests((prev) => prev.map((r) => (r.id === id ? response.data! : r)));
    }
  };

  const handleEscalate = async (id: string) => {
    const response = await landlordService.escalateMaintenance(id);
    if (response.success && response.data) {
      setRequests((prev) => prev.map((r) => (r.id === id ? response.data! : r)));
    }
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
