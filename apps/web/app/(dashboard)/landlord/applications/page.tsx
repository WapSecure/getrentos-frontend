'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ROUTES } from '@/lib/constants/auth';
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
import { ApplicationCard } from '@/components/landlord/applications/ApplicationCard';
import { ApplicationDetailsModal } from '@/components/landlord/applications/ApplicationDetailsModal';
import { RequestInfoDialog } from '@/components/landlord/applications/RequestInfoDialog';
import { landlordService } from '@/services/landlordService';
import { unwrap } from '@/lib/apiHelpers';
import { ListState } from '@/components/shared/ListState';
import { landlordKeys } from '@/lib/queryKeys';
import type { ApplicationStatus, RentalApplication } from '@/types/landlord';
import { LandlordLettingsNav } from '@/components/shared/navigation/WorkflowNavs';

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

  const openDraftLeases = () => router.push(`${ROUTES.LANDLORD_LEASES}?status=draft`);

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: ApplicationStatus }) =>
      unwrap(landlordService.updateApplicationStatus(id, status)),
    onSuccess: (updated) => {
      queryClient.invalidateQueries({ queryKey: ['landlord', 'applications'] });
      setSelectedApplication((prev) => (prev && prev.id === updated.id ? updated : prev));
      if (updated.status === 'approved') {
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
    (selectedApplication?.id === id ? selectedApplication : null);
  const askToDecide = (status: 'approved' | 'rejected') => (id: string) => {
    const application = findApplication(id);
    if (application) setDeciding({ status, application });
  };
  const handleApprove = askToDecide('approved');
  const handleReject = askToDecide('rejected');
  const handleRequestInfo = (id: string) => {
    setRequestingInfo(
      applications.find((a) => a.id === id) ??
        (selectedApplication?.id === id ? selectedApplication : null)
    );
    setSelectedApplication(null);
  };

  return (
    <>
      <PageHeader
        title="Applications"
        description={
          <>
            {awaitingCount} application{awaitingCount === 1 ? '' : 's'} awaiting a decision
          </>
        }
      />
      <LandlordLettingsNav />

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
        onReviewLease={openDraftLeases}
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
