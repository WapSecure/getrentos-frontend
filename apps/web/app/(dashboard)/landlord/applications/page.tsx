'use client';

import { useState } from 'react';
import { keepPreviousData, useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { FileText } from 'lucide-react';
import { Pagination, EmptyState, ToggleChip, useToast } from '@getrentos/ui';
import { ApplicationCard } from '@/components/landlord/applications/ApplicationCard';
import { ApplicationDetailsModal } from '@/components/landlord/applications/ApplicationDetailsModal';
import { RequestInfoDialog } from '@/components/landlord/applications/RequestInfoDialog';
import { landlordService } from '@/services/landlordService';
import { unwrap } from '@/lib/apiHelpers';
import { ListState } from '@/components/shared/ListState';
import { landlordKeys } from '@/lib/queryKeys';
import type { ApplicationStatus, RentalApplication } from '@/types/landlord';

const statusFilters: { value: 'all' | ApplicationStatus; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'pending', label: 'Pending' },
  { value: 'under_review', label: 'Under review' },
  { value: 'approved', label: 'Approved' },
  { value: 'rejected', label: 'Rejected' },
];

const PAGE_SIZE = 10;

export default function LandlordApplicationsPage() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [filter, setFilter] = useState<'all' | ApplicationStatus>('all');
  const [selectedApplication, setSelectedApplication] = useState<RentalApplication | null>(null);
  const [requestingInfo, setRequestingInfo] = useState<RentalApplication | null>(null);
  const toast = useToast();

  const { data, isPending, isError, refetch } = useQuery({
    queryKey: [
      ...landlordKeys.applications(),
      { page, pageSize: PAGE_SIZE, status: filter === 'all' ? undefined : filter },
    ],
    queryFn: () =>
      unwrap(
        landlordService.listApplications({
          status: filter === 'all' ? undefined : filter,
          page,
          pageSize: PAGE_SIZE,
        })
      ),
    placeholderData: keepPreviousData,
  });
  const applications = data?.items ?? [];
  const total = data?.total ?? 0;

  // Header stat: every application still waiting for a decision (pending or under review),
  // across the whole portfolio rather than the page on screen.
  const { data: awaitingCount = 0 } = useQuery({
    queryKey: [...landlordKeys.applications('awaiting'), 'count'],
    queryFn: async () => {
      const [pending, underReview] = await Promise.all([
        unwrap(landlordService.listApplications({ status: 'pending', page: 1, pageSize: 1 })),
        unwrap(landlordService.listApplications({ status: 'under_review', page: 1, pageSize: 1 })),
      ]);
      return pending.total + underReview.total;
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: ApplicationStatus }) =>
      unwrap(landlordService.updateApplicationStatus(id, status)),
    onSuccess: (updated) => {
      queryClient.invalidateQueries({ queryKey: ['landlord', 'applications'] });
      setSelectedApplication((prev) => (prev && prev.id === updated.id ? updated : prev));
      toast.success(
        updated.status === 'approved'
          ? `${updated.applicantName}'s application approved.`
          : `${updated.applicantName}'s application rejected.`
      );
    },
    // A refused change (say, the unit is already let) must say why, not fail silently.
    onError: (error: Error) => toast.error(error.message || 'That change was not saved.'),
  });

  const handleApprove = (id: string) => updateStatusMutation.mutate({ id, status: 'approved' });
  const handleReject = (id: string) => updateStatusMutation.mutate({ id, status: 'rejected' });
  // Opens the message to the applicant; sending it moves a pending application to under review.
  const handleRequestInfo = (id: string) => {
    setRequestingInfo(
      applications.find((a) => a.id === id) ??
        (selectedApplication?.id === id ? selectedApplication : null)
    );
    // One dialog at a time: the details close while the message is written.
    setSelectedApplication(null);
  };

  return (
    <>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">Applications</h1>
        <p className="text-muted-foreground mt-1">
          {awaitingCount} application{awaitingCount === 1 ? '' : 's'} awaiting a decision
        </p>
      </div>

      <div
        className="mb-6 flex w-full max-w-full gap-2 overflow-x-auto pb-1"
        role="group"
        aria-label="Filter applications by status"
      >
        {statusFilters.map((option) => (
          <ToggleChip
            key={option.value}
            size="sm"
            pressed={filter === option.value}
            onPressedChange={() => {
              setFilter(option.value);
              setPage(1);
            }}
          >
            {option.label}
          </ToggleChip>
        ))}
      </div>

      <ListState
        items={applications}
        query={{ isPending, isError, refetch }}
        errorTitle="We couldn't load your applications"
        skeletonClassName="h-32"
        empty={<EmptyState icon={FileText} title="No applications found" />}
      >
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {applications.map((application, index) => (
            <ApplicationCard
              key={application.id}
              application={application}
              delay={index * 0.05}
              onViewDetails={() => setSelectedApplication(application)}
              onApprove={() => handleApprove(application.id)}
              onReject={() => handleReject(application.id)}
              onRequestInfo={() => handleRequestInfo(application.id)}
            />
          ))}
        </div>
      </ListState>

      {total > 0 && (
        <Pagination
          page={page}
          pageSize={PAGE_SIZE}
          total={total}
          onPageChange={setPage}
          className="mt-6"
        />
      )}

      <ApplicationDetailsModal
        application={selectedApplication}
        onClose={() => setSelectedApplication(null)}
        onApprove={handleApprove}
        onReject={handleReject}
        onRequestInfo={handleRequestInfo}
        unitHeldBy={
          selectedApplication
            ? (applications.find(
                (a) =>
                  a.id !== selectedApplication.id &&
                  a.unitId === selectedApplication.unitId &&
                  a.status === 'approved'
              )?.applicantName ?? null)
            : null
        }
      />

      <RequestInfoDialog
        key={requestingInfo?.id ?? 'none'}
        application={requestingInfo}
        onClose={() => setRequestingInfo(null)}
      />
    </>
  );
}
