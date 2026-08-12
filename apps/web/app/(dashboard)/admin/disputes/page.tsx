'use client';

import { useMemo, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Search, Gavel } from 'lucide-react';
import { DisputeCard } from '@/components/admin/disputes/DisputeCard';
import { DisputeResolutionModal } from '@/components/admin/disputes/DisputeResolutionModal';
import { EmptyState } from '@/components/ui/EmptyState';
import { cn } from '@/lib/cn';
import { adminService } from '@/services/adminService';
import { unwrap } from '@/lib/apiHelpers';
import { adminKeys } from '@/lib/queryKeys';
import type { DisputeCategory, DisputeStatus } from '@/types/admin';

type StatusFilter = 'all' | DisputeStatus;
type CategoryFilter = 'all' | DisputeCategory;

export default function AdminDisputesPage() {
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>('all');
  const [activeDisputeId, setActiveDisputeId] = useState<string | null>(null);

  const { data: disputes = [], isLoading } = useQuery({
    queryKey: adminKeys.disputes(),
    queryFn: () => unwrap(adminService.listDisputes()),
  });

  const { data: activeDisputeMessages = [] } = useQuery({
    queryKey: adminKeys.disputeMessages(activeDisputeId ?? ''),
    queryFn: () => unwrap(adminService.getDisputeMessages(activeDisputeId!)),
    enabled: !!activeDisputeId,
  });

  const activeDispute = disputes.find((d) => d.id === activeDisputeId) || null;

  const invalidateDisputes = () =>
    queryClient.invalidateQueries({ queryKey: adminKeys.disputes() });

  const resolveMutation = useMutation({
    mutationFn: (id: string) => unwrap(adminService.resolveDispute(id)),
    onSuccess: invalidateDisputes,
  });

  const escalateMutation = useMutation({
    mutationFn: (id: string) => unwrap(adminService.escalateDispute(id)),
    onSuccess: invalidateDisputes,
  });

  const sendMessageMutation = useMutation({
    mutationFn: ({ id, text }: { id: string; text: string }) =>
      unwrap(adminService.sendDisputeMessage(id, text)),
    onSuccess: (_, { id }) =>
      queryClient.invalidateQueries({ queryKey: adminKeys.disputeMessages(id) }),
  });

  const handleResolve = (id: string) => resolveMutation.mutate(id);
  const handleEscalate = (id: string) => escalateMutation.mutate(id);
  const handleSendMessage = (id: string, text: string) => sendMessageMutation.mutate({ id, text });

  const filteredDisputes = useMemo(
    () =>
      disputes.filter((d) => {
        const matchesSearch =
          d.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          d.raisedBy.toLowerCase().includes(searchQuery.toLowerCase()) ||
          d.against.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesStatus = statusFilter === 'all' || d.status === statusFilter;
        const matchesCategory = categoryFilter === 'all' || d.category === categoryFilter;
        return matchesSearch && matchesStatus && matchesCategory;
      }),
    [disputes, searchQuery, statusFilter, categoryFilter]
  );

  const activeDisputeCount = useMemo(
    () => disputes.filter((d) => d.status === 'open' || d.status === 'under_review').length,
    [disputes]
  );

  const statusOptions: { value: StatusFilter; label: string }[] = [
    { value: 'all', label: 'All' },
    { value: 'open', label: 'Open' },
    { value: 'under_review', label: 'Under Review' },
    { value: 'escalated', label: 'Escalated' },
    { value: 'resolved', label: 'Resolved' },
  ];

  const categoryOptions: { value: CategoryFilter; label: string }[] = [
    { value: 'all', label: 'All Categories' },
    { value: 'escrow', label: 'Escrow' },
    { value: 'lease', label: 'Lease' },
    { value: 'sale', label: 'Sale' },
    { value: 'service_quality', label: 'Service Quality' },
    { value: 'payment', label: 'Payment' },
  ];

  return (
    <>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">Dispute &amp; Arbitration</h1>
        <p className="text-muted-foreground mt-1">
          {activeDisputeCount} active dispute{activeDisputeCount === 1 ? '' : 's'} requiring
          attention
        </p>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by title or party..."
            className="w-full pl-10 pr-4 py-2 rounded-lg border border-border bg-card text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value as CategoryFilter)}
          className="px-3 py-2 rounded-lg border border-border bg-card text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary w-fit"
        >
          {categoryOptions.map((option) => (
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
      ) : filteredDisputes.length === 0 ? (
        <EmptyState icon={Gavel} title="No disputes match your filters" />
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredDisputes.map((dispute, index) => (
            <DisputeCard
              key={dispute.id}
              dispute={dispute}
              delay={index * 0.05}
              onClick={() => setActiveDisputeId(dispute.id)}
            />
          ))}
        </div>
      )}

      <DisputeResolutionModal
        dispute={activeDispute}
        messages={activeDisputeMessages}
        onClose={() => setActiveDisputeId(null)}
        onResolve={handleResolve}
        onEscalate={handleEscalate}
        onSendMessage={handleSendMessage}
      />
    </>
  );
}
