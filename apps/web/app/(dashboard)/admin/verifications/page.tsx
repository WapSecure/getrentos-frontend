'use client';

import { useState, useEffect } from 'react';
import { Search, ShieldCheck } from 'lucide-react';
import { VerificationRequestCard } from '@/components/admin/verifications/VerificationRequestCard';
import { ReviewVerificationModal } from '@/components/admin/verifications/ReviewVerificationModal';
import { EmptyState } from '@/components/ui/EmptyState';
import { cn } from '@/lib/cn';
import { adminService } from '@/services/adminService';
import type {
  VerificationRequest,
  VerificationRequestStatus,
  VerificationRequestType,
} from '@/types/admin';

type StatusFilter = 'all' | VerificationRequestStatus;
type TypeFilter = 'all' | VerificationRequestType;

export default function AdminVerificationsPage() {
  const [requests, setRequests] = useState<VerificationRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [typeFilter, setTypeFilter] = useState<TypeFilter>('all');
  const [activeRequest, setActiveRequest] = useState<VerificationRequest | null>(null);

  useEffect(() => {
    const fetchRequests = async () => {
      setIsLoading(true);
      const response = await adminService.listVerifications();
      if (response.success && response.data) {
        setRequests(response.data);
      }
      setIsLoading(false);
    };

    fetchRequests();
  }, []);

  const handleApprove = async (id: string) => {
    const response = await adminService.approveVerification(id);
    if (response.success) {
      setRequests((prev) => prev.map((r) => (r.id === id ? { ...r, status: 'approved' } : r)));
    }
  };

  const handleReject = async (id: string, reason: string) => {
    const response = await adminService.rejectVerification(id, reason);
    if (response.success) {
      setRequests((prev) =>
        prev.map((r) => (r.id === id ? { ...r, status: 'rejected', rejectionReason: reason } : r))
      );
    }
  };

  const handleRequestClarification = async (id: string, reason: string) => {
    const response = await adminService.requestVerificationClarification(id, reason);
    if (response.success) {
      setRequests((prev) =>
        prev.map((r) =>
          r.id === id ? { ...r, status: 'needs_clarification', rejectionReason: reason } : r
        )
      );
    }
  };

  const filteredRequests = requests.filter((r) => {
    const matchesSearch =
      r.applicantName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.subjectLabel.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || r.status === statusFilter;
    const matchesType = typeFilter === 'all' || r.type === typeFilter;
    return matchesSearch && matchesStatus && matchesType;
  });

  const statusOptions: { value: StatusFilter; label: string }[] = [
    { value: 'all', label: 'All' },
    { value: 'pending_review', label: 'Pending' },
    { value: 'needs_clarification', label: 'Needs Info' },
    { value: 'approved', label: 'Approved' },
    { value: 'rejected', label: 'Rejected' },
  ];

  const typeOptions: { value: TypeFilter; label: string }[] = [
    { value: 'all', label: 'All Types' },
    { value: 'identity', label: 'Identity' },
    { value: 'property', label: 'Property' },
    { value: 'license', label: 'License' },
  ];

  return (
    <>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">Verification Queue</h1>
        <p className="text-muted-foreground mt-1">
          {requests.filter((r) => r.status === 'pending_review').length} request
          {requests.filter((r) => r.status === 'pending_review').length === 1 ? '' : 's'} awaiting
          review
        </p>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by applicant or subject..."
            className="w-full pl-10 pr-4 py-2 rounded-lg border border-border bg-card text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value as TypeFilter)}
          className="px-3 py-2 rounded-lg border border-border bg-card text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary w-fit"
        >
          {typeOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      <div className="flex gap-1 p-1 bg-secondary rounded-lg w-fit overflow-x-auto mb-6">
        {statusOptions.map((option) => (
          <button
            key={option.value}
            onClick={() => setStatusFilter(option.value)}
            className={cn(
              'px-3 py-1.5 rounded-md text-xs font-medium transition-colors whitespace-nowrap',
              statusFilter === option.value
                ? 'bg-card text-primary shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            {option.label}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="flex justify-center py-16">
          <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      ) : filteredRequests.length === 0 ? (
        <EmptyState icon={ShieldCheck} title="No requests match your filters" />
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredRequests.map((request, index) => (
            <VerificationRequestCard
              key={request.id}
              request={request}
              delay={index * 0.05}
              onReview={() => setActiveRequest(request)}
            />
          ))}
        </div>
      )}

      <ReviewVerificationModal
        request={activeRequest}
        onClose={() => setActiveRequest(null)}
        onApprove={handleApprove}
        onReject={handleReject}
        onRequestClarification={handleRequestClarification}
      />
    </>
  );
}
