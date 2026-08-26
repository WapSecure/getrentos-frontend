'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Search, UsersRound, Flame, X } from 'lucide-react';
import { Button, LegacyInput, Pagination, Toast, type ToastVariant } from '@getrentos/ui';
import { LeadCard } from '@/components/landlord/leads/LeadCard';
import { ConfirmViewingModal } from '@/components/landlord/leads/ConfirmViewingModal';
import { NudgeModal } from '@/components/landlord/leads/NudgeModal';
import { BulkNudgeModal } from '@/components/landlord/leads/BulkNudgeModal';
import { landlordService } from '@/services/landlordService';
import { unwrap } from '@/lib/apiHelpers';
import { landlordKeys } from '@/lib/queryKeys';
import type { LandlordLead, LeadStage } from '@/types/landlord';
import { ROUTES } from '@/lib/constants/auth';

type StageFilter = 'all' | LeadStage;

const PAGE_SIZE = 12;

const filterOptions: { value: StageFilter; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'inquiry', label: 'Inquiry' },
  { value: 'requested', label: 'Viewing Requested' },
  { value: 'confirmed', label: 'Viewing Confirmed' },
  { value: 'completed', label: 'Viewing Completed' },
  { value: 'pending', label: 'Applied' },
  { value: 'under_review', label: 'Under Review' },
  { value: 'approved', label: 'Approved' },
  { value: 'rejected', label: 'Rejected' },
  { value: 'cancelled', label: 'Cancelled' },
];

export default function LandlordLeadsPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [filter, setFilter] = useState<StageFilter>('all');
  const [staleOnly, setStaleOnly] = useState(false);
  const [confirmingLead, setConfirmingLead] = useState<LandlordLead | null>(null);
  const [nudgingLead, setNudgingLead] = useState<LandlordLead | null>(null);
  const [selectedLeadIds, setSelectedLeadIds] = useState<string[]>([]);
  const [showBulkNudge, setShowBulkNudge] = useState(false);
  const [toast, setToast] = useState<{ message: string; variant: ToastVariant } | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const { data } = useQuery({
    queryKey: [
      ...landlordKeys.leads,
      {
        search: debouncedSearch,
        stage: filter === 'all' ? undefined : filter,
        staleOnly: staleOnly || undefined,
        page,
        pageSize: PAGE_SIZE,
      },
    ],
    queryFn: () =>
      unwrap(
        landlordService.listLeads({
          search: debouncedSearch || undefined,
          stage: filter === 'all' ? undefined : filter,
          staleOnly: staleOnly || undefined,
          page,
          pageSize: PAGE_SIZE,
        })
      ),
  });
  const leads = data?.items ?? [];
  const total = data?.total ?? 0;

  const messageMutation = useMutation({
    mutationFn: (lead: LandlordLead) =>
      unwrap(landlordService.startConversation(lead.leadUserId!, lead.propertyId)),
    onSuccess: () => router.push(ROUTES.LANDLORD_MESSAGES),
  });

  const confirmMutation = useMutation({
    mutationFn: (scheduledAt: string) =>
      unwrap(landlordService.confirmViewingRequest(confirmingLead!.viewingRequestId!, scheduledAt)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: landlordKeys.leads });
      setConfirmingLead(null);
    },
  });

  const cancelMutation = useMutation({
    mutationFn: (id: string) => unwrap(landlordService.cancelViewingRequest(id)),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: landlordKeys.leads }),
  });

  const nudgeMutation = useMutation({
    mutationFn: (message: string) => unwrap(landlordService.nudgeLead(nudgingLead!.id, message)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: landlordKeys.leads });
      setToast({ message: `Nudge sent to ${nudgingLead?.leadName}.`, variant: 'success' });
      setNudgingLead(null);
    },
    onError: (error: Error) => {
      setToast({ message: error.message || 'Unable to send this nudge.', variant: 'error' });
    },
  });

  const bulkNudgeMutation = useMutation({
    mutationFn: (message: string) =>
      unwrap(landlordService.bulkNudgeLeads(selectedLeadIds, message)),
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: landlordKeys.leads });
      const summary =
        result.skipped > 0
          ? `Nudged ${result.nudged} lead${result.nudged === 1 ? '' : 's'}, skipped ${result.skipped}.`
          : `Nudged ${result.nudged} lead${result.nudged === 1 ? '' : 's'}.`;
      setToast({ message: summary, variant: result.nudged > 0 ? 'success' : 'error' });
      setSelectedLeadIds([]);
      setShowBulkNudge(false);
    },
    onError: (error: Error) => {
      setToast({ message: error.message || 'Unable to send these nudges.', variant: 'error' });
    },
  });

  const toggleLeadSelection = (leadId: string) => {
    setSelectedLeadIds((current) =>
      current.includes(leadId) ? current.filter((id) => id !== leadId) : [...current, leadId]
    );
  };

  return (
    <>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">Leads</h1>
        <p className="text-muted-foreground mt-1">
          {total} lead{total === 1 ? '' : 's'} across your properties
        </p>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <LegacyInput
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by name, email, or property..."
            className="w-full pl-10 pr-4 py-2 rounded-lg border border-border bg-card text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
        <button
          onClick={() => {
            setStaleOnly((current) => !current);
            setPage(1);
          }}
          className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap border ${
            staleOnly
              ? 'bg-amber-50 border-amber-300 text-amber-700 dark:bg-amber-900/20 dark:border-amber-700 dark:text-amber-400'
              : 'bg-card border-border text-muted-foreground hover:text-gray-900 dark:hover:text-white'
          }`}
        >
          <Flame className="w-4 h-4" />
          Going cold
        </button>
      </div>

      <div className="mb-6">
        <div className="flex gap-1 p-1 bg-secondary rounded-lg w-fit overflow-x-auto">
          {filterOptions.map((option) => (
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
      </div>

      {selectedLeadIds.length > 0 && (
        <div className="flex items-center justify-between gap-3 mb-4 px-4 py-3 rounded-xl bg-accent border border-primary/20">
          <span className="text-sm font-medium text-foreground">
            {selectedLeadIds.length} selected
          </span>
          <div className="flex items-center gap-2">
            <Button
              variant="primary"
              size="sm"
              className="gap-1.5"
              onClick={() => setShowBulkNudge(true)}
            >
              <Flame className="w-3.5 h-3.5" />
              Nudge all
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="px-2"
              onClick={() => setSelectedLeadIds([])}
              title="Clear selection"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}

      {leads.length === 0 ? (
        <div className="bg-card rounded-2xl border border-border p-12 text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-accent flex items-center justify-center">
            <UsersRound className="w-8 h-8 text-primary" />
          </div>
          <h3 className="text-lg font-semibold text-foreground">
            {total === 0
              ? staleOnly
                ? 'No cold leads right now'
                : 'No leads yet'
              : 'No leads match your filters'}
          </h3>
          <p className="text-sm text-muted-foreground mt-1 max-w-sm mx-auto">
            {total === 0
              ? staleOnly
                ? "Leads that go quiet for a few days will show up here so you don't lose track of them."
                : 'Messages, viewing requests, and applications from renters will appear here.'
              : 'Try adjusting your search or filter.'}
          </p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {leads.map((lead, index) => (
            <LeadCard
              key={lead.id}
              lead={lead}
              delay={index * 0.05}
              selected={selectedLeadIds.includes(lead.id)}
              onToggleSelect={() => toggleLeadSelection(lead.id)}
              onMessage={() => messageMutation.mutate(lead)}
              onViewApplication={() => router.push(ROUTES.LANDLORD_APPLICATIONS)}
              onConfirmViewing={() => setConfirmingLead(lead)}
              onCancelViewing={() => cancelMutation.mutate(lead.viewingRequestId!)}
              onNudge={() => setNudgingLead(lead)}
              isUpdatingViewing={
                cancelMutation.isPending && cancelMutation.variables === lead.viewingRequestId
              }
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

      <ConfirmViewingModal
        lead={confirmingLead}
        onClose={() => setConfirmingLead(null)}
        onConfirm={(scheduledAt) => confirmMutation.mutate(scheduledAt)}
        isSubmitting={confirmMutation.isPending}
        isError={confirmMutation.isError}
      />

      <NudgeModal
        key={nudgingLead?.id ?? 'none'}
        lead={nudgingLead}
        onClose={() => setNudgingLead(null)}
        onSend={(message) => nudgeMutation.mutate(message)}
        isSubmitting={nudgeMutation.isPending}
        isError={nudgeMutation.isError}
      />

      {showBulkNudge && (
        <BulkNudgeModal
          leadCount={selectedLeadIds.length}
          onClose={() => setShowBulkNudge(false)}
          onSend={(message) => bulkNudgeMutation.mutate(message)}
          isSubmitting={bulkNudgeMutation.isPending}
          isError={bulkNudgeMutation.isError}
        />
      )}

      {toast && (
        <Toast message={toast.message} variant={toast.variant} onClose={() => setToast(null)} />
      )}
    </>
  );
}
