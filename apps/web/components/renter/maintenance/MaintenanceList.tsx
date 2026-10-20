'use client';

import { useState } from 'react';
import { Wrench } from 'lucide-react';
import { Card, EmptyState, SearchInput, Select } from '@getrentos/ui';
import { MaintenanceCard } from './MaintenanceCard';
import { MaintenanceDetailsModal } from './MaintenanceDetailsModal';
import { VendorRatingModal } from './VendorRatingModal';
import type { MaintenanceRequest } from '@/types/maintenance';

interface MaintenanceListProps {
  requests: MaintenanceRequest[];
  onUpdateStatus: (id: string, status: MaintenanceRequest['status']) => void;
  onRateVendor: (id: string, rating: number) => Promise<boolean>;
}

const statusOptions = [
  { value: 'all', label: 'All' },
  { value: 'submitted', label: 'Submitted' },
  { value: 'assigned', label: 'Assigned' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'resolved', label: 'Resolved' },
  { value: 'cancelled', label: 'Cancelled' },
];

const priorityOptions = [
  { value: 'all', label: 'All Priorities' },
  { value: 'urgent', label: 'Urgent' },
  { value: 'high', label: 'High' },
  { value: 'medium', label: 'Medium' },
  { value: 'low', label: 'Low' },
];

export const MaintenanceList = ({
  requests,
  onUpdateStatus,
  onRateVendor,
}: MaintenanceListProps) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterPriority, setFilterPriority] = useState<string>('all');
  const [selectedRequest, setSelectedRequest] = useState<MaintenanceRequest | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [ratingRequestId, setRatingRequestId] = useState<string | null>(null);

  const filteredRequests = requests.filter((req) => {
    const matchesSearch =
      req.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      req.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      req.propertyName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || req.status === filterStatus;
    const matchesPriority = filterPriority === 'all' || req.priority === filterPriority;
    return matchesSearch && matchesStatus && matchesPriority;
  });

  const handleViewDetails = (request: MaintenanceRequest) => {
    setSelectedRequest(request);
    setShowDetailsModal(true);
  };

  const handleRateVendor = (id: string) => {
    setRatingRequestId(id);
    setShowRatingModal(true);
  };

  const handleSubmitRating = async (rating: number) => {
    if (ratingRequestId) {
      const saved = await onRateVendor(ratingRequestId, rating);
      if (saved) {
        setShowRatingModal(false);
        setRatingRequestId(null);
      }
    }
  };

  return (
    <>
      <Card>
        <div className="p-4 border-b border-border">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h3 className="font-semibold text-foreground">Maintenance Requests</h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                {filteredRequests.length} requests found
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <SearchInput
                value={searchTerm}
                onValueChange={setSearchTerm}
                label="Search maintenance requests"
                placeholder="Search..."
                className="w-full sm:w-48"
              />

              <Select
                value={filterStatus}
                onValueChange={setFilterStatus}
                options={statusOptions}
                ariaLabel="Filter by status"
                className="w-full sm:w-40"
              />

              <Select
                value={filterPriority}
                onValueChange={setFilterPriority}
                options={priorityOptions}
                ariaLabel="Filter by priority"
                className="w-full sm:w-40"
              />
            </div>
          </div>
        </div>

        <div className="divide-y divide-border">
          {filteredRequests.length === 0 ? (
            <EmptyState
              icon={Wrench}
              bare
              title="No maintenance requests"
              description={
                searchTerm || filterStatus !== 'all' || filterPriority !== 'all'
                  ? 'Try adjusting your filters'
                  : 'Report an issue to get started'
              }
            />
          ) : (
            filteredRequests.map((request) => (
              <div key={request.id}>
                <MaintenanceCard
                  request={request}
                  onViewDetails={() => handleViewDetails(request)}
                  onRateVendor={handleRateVendor}
                  onUpdateStatus={onUpdateStatus}
                />
              </div>
            ))
          )}
        </div>
      </Card>

      {/* Details Modal */}
      {selectedRequest && (
        <MaintenanceDetailsModal
          isOpen={showDetailsModal}
          onClose={() => setShowDetailsModal(false)}
          request={selectedRequest}
          onUpdateStatus={onUpdateStatus}
        />
      )}

      {/* Vendor Rating Modal */}
      <VendorRatingModal
        isOpen={showRatingModal}
        onClose={() => setShowRatingModal(false)}
        onSubmit={handleSubmitRating}
      />
    </>
  );
};
