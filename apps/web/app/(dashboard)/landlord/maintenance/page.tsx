'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Wrench } from 'lucide-react';
import { Pagination } from '@getrentos/ui';
import { MaintenanceRequestCard } from '@/components/landlord/maintenance/MaintenanceRequestCard';
import { AssignVendorModal } from '@/components/landlord/maintenance/AssignVendorModal';
import { landlordService } from '@/services/landlordService';
import { unwrap } from '@/lib/apiHelpers';
import { landlordKeys } from '@/lib/queryKeys';
import type { LandlordMaintenanceRequest } from '@/types/landlord';
import type { MaintenanceRequestStatus } from '@/types/maintenance';

const statusFilters: { value: 'all' | MaintenanceRequestStatus; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'submitted', label: 'Submitted' },
  { value: 'assigned', label: 'Assigned' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'resolved', label: 'Resolved' },
];

const PAGE_SIZE = 10;

export default function LandlordMaintenancePage() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [filter, setFilter] = useState<'all' | MaintenanceRequestStatus>('all');
  const [assigningRequest, setAssigningRequest] = useState<LandlordMaintenanceRequest | null>(null);

  const { data } = useQuery({
    queryKey: [
      ...landlordKeys.maintenanceRequests(),
      { page, pageSize: PAGE_SIZE, status: filter === 'all' ? undefined : filter },
    ],
    queryFn: () =>
      unwrap(
        landlordService.listMaintenanceRequests({
          status: filter === 'all' ? undefined : filter,
          page,
          pageSize: PAGE_SIZE,
        })
      ),
  });
  const requests = data?.items ?? [];
  const total = data?.total ?? 0;

  const { data: summary } = useQuery({
    queryKey: landlordKeys.maintenanceSummary,
    queryFn: () => unwrap(landlordService.getMaintenanceSummary()),
  });
  const openCount = summary?.openCount ?? 0;

  const invalidateRequests = () => {
    void queryClient.invalidateQueries({ queryKey: ['landlord', 'maintenanceRequests'] });
    void queryClient.invalidateQueries({ queryKey: landlordKeys.maintenanceSummary });
  };

  const assignVendorMutation = useMutation({
    mutationFn: ({ requestId, vendorId }: { requestId: string; vendorId: string }) =>
      unwrap(landlordService.assignMaintenanceVendor(requestId, vendorId)),
    onSuccess: () => {
      invalidateRequests();
      setAssigningRequest(null);
    },
  });

  const markResolvedMutation = useMutation({
    mutationFn: (id: string) => unwrap(landlordService.markMaintenanceResolved(id)),
    onSuccess: invalidateRequests,
  });

  const escalateMutation = useMutation({
    mutationFn: (id: string) => unwrap(landlordService.escalateMaintenance(id)),
    onSuccess: invalidateRequests,
  });

  const handleAssignVendor = (requestId: string, vendorId: string) =>
    assignVendorMutation.mutate({ requestId, vendorId });

  const handleMarkResolved = (id: string) => markResolvedMutation.mutate(id);

  const handleEscalate = (id: string) => escalateMutation.mutate(id);

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
            onClick={() => {
              setFilter(option.value);
              setPage(1);
            }}
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

      {requests.length === 0 ? (
        <div className="bg-card rounded-2xl border border-border p-12 text-center">
          <Wrench className="w-10 h-10 text-muted-foreground/50 mx-auto mb-3" />
          <p className="text-muted-foreground">No maintenance requests found</p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {requests.map((request, index) => (
            <MaintenanceRequestCard
              key={request.id}
              request={request}
              delay={index * 0.05}
              onAssignVendor={setAssigningRequest}
              onMarkResolved={handleMarkResolved}
              onEscalate={handleEscalate}
              isMarkingResolved={
                markResolvedMutation.isPending && markResolvedMutation.variables === request.id
              }
              isEscalating={escalateMutation.isPending && escalateMutation.variables === request.id}
            />
          ))}
        </div>
      )}

      {total > 0 && (
        <Pagination
          page={page}
          pageSize={PAGE_SIZE}
          total={total}
          onPageChange={setPage}
          className="mt-6"
        />
      )}

      <AssignVendorModal
        request={assigningRequest}
        onClose={() => setAssigningRequest(null)}
        onAssign={handleAssignVendor}
        assigningVendorId={
          assignVendorMutation.isPending ? assignVendorMutation.variables?.vendorId : null
        }
      />
    </>
  );
}
