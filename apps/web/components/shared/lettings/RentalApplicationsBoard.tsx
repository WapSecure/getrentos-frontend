'use client';

import { useState, type ReactNode } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { keepPreviousData, useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { FileText } from '@sureground/icons';
import {
  ConfirmDialog,
  Pagination,
  EmptyState,
  ToggleChip,
  useToast,
  PageHeader,
} from '@sureground/ui';
import { RecordGridSkeleton, RecordToolbar } from '@/components/shared/records/RecordParts';
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

type RentalApplicationsBoardProps = {
  /** Where an approved applicant's draft lease is reviewed in this portal. */
  leasesHref: string;
  /** The portal's section nav, if it has one. */
  nav?: ReactNode;
};

/** Rental applications for every home the signed-in person controls: landlords and owners alike. */
export function RentalApplicationsBoard({ leasesHref, nav }: RentalApplicationsBoardProps) {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [filter, setFilter] = useState<'all' | ApplicationStatus>('all');
  const [selectedApplication, setSelectedApplication] = useState<RentalApplication | null>(null);
  const [requestingInfo, setRequestingInfo] = useState<RentalApplication | null>(null);
  const [deciding, setDeciding] = useState<{
    status: 'approved' | 'rejected';
    application: RentalApplication;
  } | null>(null);
  const toast = useToast();
  const router = useRouter();

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

  const openDraftLeases = () => router.push(`${leasesHref}?status=draft`);

  // A notification links here with ?application=<id>; open that one once it is on the page.
  const searchParams = useSearchParams();
  const linkedId = searchParams.get('application');
  const [linkedDismissed, setLinkedDismissed] = useState(false);
  const linkedApplication =
    linkedId && !linkedDismissed ? (applications.find((a) => a.id === linkedId) ?? null) : null;
  const detailsApplication = selectedApplication ?? linkedApplication;
  const closeDetails = () => {
    setSelectedApplication(null);
    setLinkedDismissed(true);
  };

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: ApplicationStatus }) =>
      unwrap(landlordService.updateApplicationStatus(id, status)),
    onSuccess: (updated) => {
      queryClient.invalidateQueries({ queryKey: ['landlord', 'applications'] });
      setSelectedApplication((prev) => (prev && prev.id === updated.id ? updated : prev));
      if (updated.status === 'approved' && updated.leaseDrafted === false) {
        toast.success(
          `${updated.applicantName}'s application approved. We couldn't draft their lease automatically: create it and set the rent.`,
          {
            duration: 12_000,
            action: { label: 'Create lease', onClick: () => router.push(`${leasesHref}?create=1`) },
          }
        );
      } else if (updated.status === 'approved') {
        toast.success(
          `${updated.applicantName}'s application approved. We've drafted their lease: review and send it.`,
          { duration: 12_000, action: { label: 'Review lease', onClick: openDraftLeases } }
        );
      } else {
        toast.success(`${updated.applicantName}'s application rejected.`);
      }
    },
    onError: (error: Error) => toast.error(error.message || 'That change was not saved.'),
  });

  const findApplication = (id: string) =>
    applications.find((a) => a.id === id) ??
    (detailsApplication?.id === id ? detailsApplication : null);
  const askToDecide = (status: 'approved' | 'rejected') => (id: string) => {
    const application = findApplication(id);
    if (application) setDeciding({ status, application });
  };
  const handleApprove = askToDecide('approved');
  const handleReject = askToDecide('rejected');
  const handleRequestInfo = (id: string) => {
    setRequestingInfo(findApplication(id));
    closeDetails();
  };

  return (
    <>
      <PageHeader
        eyebrow="Lettings"
        title="Applications"
        description={
          <>
            {awaitingCount} application{awaitingCount === 1 ? '' : 's'} awaiting a decision
          </>
        }
      />
      {nav}

      <RecordToolbar>
        <div
          className="flex w-full max-w-full gap-2 overflow-x-auto"
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
      </RecordToolbar>

      <ListState
        items={applications}
        query={{ isPending, isError, refetch }}
        errorTitle="We couldn't load your applications"
        skeleton={<RecordGridSkeleton />}
        empty={
          <EmptyState
            icon={FileText}
            title="No applications found"
            description="Applications from renters appear here as they come in."
          />
        }
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
        application={detailsApplication}
        onClose={closeDetails}
        onApprove={handleApprove}
        onReject={handleReject}
        onRequestInfo={handleRequestInfo}
        onReviewLease={openDraftLeases}
        unitHeldBy={
          detailsApplication
            ? (applications.find(
                (a) =>
                  a.id !== detailsApplication.id &&
                  a.unitId === detailsApplication.unitId &&
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

      <ConfirmDialog
        open={deciding !== null}
        onOpenChange={(open) => {
          if (!open) setDeciding(null);
        }}
        tone={deciding?.status === 'approved' ? 'primary' : 'danger'}
        title={
          deciding?.status === 'approved' ? 'Approve this application?' : 'Reject this application?'
        }
        description={
          !deciding
            ? ''
            : deciding.status === 'approved'
              ? `${deciding.application.applicantName}'s application for ${deciding.application.propertyName} • ${deciding.application.unitName} is approved and we draft their lease. This can't be undone from here.`
              : `${deciding.application.applicantName}'s application for ${deciding.application.propertyName} • ${deciding.application.unitName} is rejected. This can't be undone from here.`
        }
        confirmLabel={deciding?.status === 'approved' ? 'Approve' : 'Reject'}
        onConfirm={() =>
          deciding &&
          updateStatusMutation.mutateAsync({
            id: deciding.application.id,
            status: deciding.status,
          })
        }
        isLoading={updateStatusMutation.isPending}
      />
    </>
  );
}
