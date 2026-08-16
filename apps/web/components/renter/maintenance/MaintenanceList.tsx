'use client';

import { LegacyInput } from '@getrentos/ui';

import { LegacySelect } from '@getrentos/ui';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Filter, Wrench, Clock, CheckCircle } from 'lucide-react';
import { MaintenanceCard } from './MaintenanceCard';
import { MaintenanceDetailsModal } from './MaintenanceDetailsModal';
import { VendorRatingModal } from './VendorRatingModal';
import type { MaintenanceRequest } from '@/types/maintenance';

interface MaintenanceListProps {
  requests: MaintenanceRequest[];
  onUpdateStatus: (id: string, status: MaintenanceRequest['status']) => void;
  onRateVendor: (id: string, rating: number) => void;
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

  const handleSubmitRating = (rating: number) => {
    if (ratingRequestId) {
      onRateVendor(ratingRequestId, rating);
      setShowRatingModal(false);
      setRatingRequestId(null);
    }
  };

  return (
    <>
      <div className="bg-card rounded-xl border border-border overflow-hidden">
        <div className="p-4 border-b border-border">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h3 className="font-semibold text-foreground">Maintenance Requests</h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                {filteredRequests.length} requests found
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <LegacyInput
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search..."
                  className="pl-10 pr-4 py-2 text-sm rounded-lg border border-border bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary w-full sm:w-40"
                />
              </div>

              <LegacySelect
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-3 py-2 text-sm rounded-lg border border-border bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              >
                {statusOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </LegacySelect>

              <LegacySelect
                value={filterPriority}
                onChange={(e) => setFilterPriority(e.target.value)}
                className="px-3 py-2 text-sm rounded-lg border border-border bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              >
                {priorityOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </LegacySelect>
            </div>
          </div>
        </div>

        <div className="divide-y divide-border">
          {filteredRequests.length === 0 ? (
            <div className="p-8 text-center">
              <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center">
                <Wrench className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-foreground">No maintenance requests</h3>
              <p className="text-muted-foreground mt-1">
                {searchTerm || filterStatus !== 'all' || filterPriority !== 'all'
                  ? 'Try adjusting your filters'
                  : 'Report an issue to get started'}
              </p>
            </div>
          ) : (
            filteredRequests.map((request, index) => (
              <motion.div
                key={request.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <MaintenanceCard
                  request={request}
                  onViewDetails={() => handleViewDetails(request)}
                  onRateVendor={handleRateVendor}
                  onUpdateStatus={onUpdateStatus}
                />
              </motion.div>
            ))
          )}
        </div>
      </div>

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
