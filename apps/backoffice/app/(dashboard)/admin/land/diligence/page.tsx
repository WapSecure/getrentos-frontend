'use client';

import { useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { CircleAlert, ClipboardCheck, RefreshCw, Search, ShieldCheck } from 'lucide-react';
import {
  Button,
  EmptyState,
  Input,
  Pagination,
  Select,
  Toast,
  type ToastVariant,
} from '@getrentos/ui';
import { unwrap } from '@getrentos/shared';
import { useAdminUser } from '../../layout';
import { hasAdminPermission } from '@/lib/adminAccess';
import { adminLandService } from '@/services/adminLandService';
import type {
  LandDiligenceDecisionInput,
  LandDiligenceRecord,
  LandDiligenceStatus,
} from '@/types/land';
import { LandDiligenceRecordCard } from '@/components/admin/land/LandDiligenceRecordCard';
import { LandDiligenceReviewDialog } from '@/components/admin/land/LandDiligenceReviewDialog';

type StatusFilter = 'all' | LandDiligenceStatus;

const PAGE_SIZE = 12;
const diligenceQueryRoot = ['admin', 'land', 'diligence'] as const;

const statusOptions: { value: StatusFilter; label: string }[] = [
  { value: 'all', label: 'All statuses' },
  { value: 'NOT_STARTED', label: 'Not started' },
  { value: 'IN_REVIEW', label: 'In review' },
  { value: 'ACTION_REQUIRED', label: 'Action required' },
  { value: 'VERIFIED', label: 'Verified' },
  { value: 'REJECTED', label: 'Rejected' },
  { value: 'EXPIRED', label: 'Expired' },
];

export default function AdminLandDiligencePage() {
  const queryClient = useQueryClient();
  const user = useAdminUser();
  const canApprove = hasAdminPermission(user?.roles, 'verifications.approve');
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [status, setStatus] = useState<StatusFilter>('all');
  const [page, setPage] = useState(1);
  const [activeRecord, setActiveRecord] = useState<LandDiligenceRecord | null>(null);
  const [toast, setToast] = useState<{ message: string; variant: ToastVariant } | null>(null);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 300);
    return () => window.clearTimeout(timer);
  }, [search]);

  const queryKey = useMemo(
    () => [...diligenceQueryRoot, debouncedSearch, status, page, PAGE_SIZE] as const,
    [debouncedSearch, page, status]
  );
  const { data, isLoading, isFetching, isError, error, refetch } = useQuery({
    queryKey,
    queryFn: () =>
      unwrap(
        adminLandService.listDiligence({
          search: debouncedSearch || undefined,
          status: status === 'all' ? undefined : status,
          page,
          pageSize: PAGE_SIZE,
        })
      ),
  });
  const records = data?.items ?? [];
  const total = data?.total ?? 0;

  const notify = (message: string, variant: ToastVariant) => setToast({ message, variant });
  const invalidate = () => queryClient.invalidateQueries({ queryKey: diligenceQueryRoot });

  const approveMutation = useMutation({
    mutationFn: ({
      propertyId,
      data: input,
    }: {
      propertyId: string;
      data: Pick<LandDiligenceDecisionInput, 'findings' | 'checklist' | 'expiresAt'>;
    }) => unwrap(adminLandService.approveDiligence(propertyId, input)),
    onSuccess: () => {
      invalidate();
      setActiveRecord(null);
      notify(
        'Land diligence approved. The listing can proceed when all publishing rules are met.',
        'success'
      );
    },
    onError: (mutationError) =>
      notify(
        mutationError instanceof Error
          ? mutationError.message
          : 'Unable to approve land diligence.',
        'error'
      ),
  });

  const rejectMutation = useMutation({
    mutationFn: ({
      propertyId,
      data: input,
    }: {
      propertyId: string;
      data: Pick<LandDiligenceDecisionInput, 'reason' | 'checklist'>;
    }) => unwrap(adminLandService.rejectDiligence(propertyId, input)),
    onSuccess: () => {
      invalidate();
      setActiveRecord(null);
      notify('Land diligence rejected and the owner has been notified.', 'success');
    },
    onError: (mutationError) =>
      notify(
        mutationError instanceof Error ? mutationError.message : 'Unable to reject land diligence.',
        'error'
      ),
  });

  const clarificationMutation = useMutation({
    mutationFn: ({
      propertyId,
      data: input,
    }: {
      propertyId: string;
      data: Pick<LandDiligenceDecisionInput, 'reason' | 'checklist'>;
    }) => unwrap(adminLandService.requestClarification(propertyId, input)),
    onSuccess: () => {
      invalidate();
      setActiveRecord(null);
      notify('Clarification requested from the owner.', 'success');
    },
    onError: (mutationError) =>
      notify(
        mutationError instanceof Error
          ? mutationError.message
          : 'Unable to request clarification for this land record.',
        'error'
      ),
  });

  const errorMessage =
    error instanceof Error ? error.message : 'Unable to load the diligence queue.';

  return (
    <>
      {toast && (
        <Toast message={toast.message} variant={toast.variant} onClose={() => setToast(null)} />
      )}

      <div className="mb-7 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-3">
          <div className="rounded-xl bg-accent p-2.5 text-primary">
            <ClipboardCheck className="h-5 w-5" />
          </div>
          <div>
            <h1 className="type-title">Land diligence</h1>
            <p className="mt-1 max-w-2xl text-muted-foreground">
              Review land titles, survey details, and structured checks before a parcel can be
              verified for sale. Evidence remains protected in the secure document workflow.
            </p>
          </div>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => refetch()}
          disabled={isFetching}
          isLoading={isFetching && !isLoading}
          icon={<RefreshCw className="h-4 w-4" />}
        >
          Refresh
        </Button>
      </div>

      {!canApprove && (
        <div className="mb-6 flex gap-3 rounded-2xl border border-warning/30 bg-warning-subtle p-4 text-sm text-foreground">
          <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-warning" />
          <p>
            You can review records and request clarification. A staff member with verification
            approval permission must make the final approve or reject decision.
          </p>
        </div>
      )}

      <div className="mb-6 flex flex-col gap-3 sm:flex-row">
        <div className="w-full max-w-lg">
          <Input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search parcel, owner, plot, survey, city…"
            leadingIcon={<Search className="h-4 w-4" />}
            aria-label="Search land diligence records"
          />
        </div>
        <Select
          value={status}
          onValueChange={(value) => {
            setStatus(value as StatusFilter);
            setPage(1);
          }}
          options={statusOptions}
          ariaLabel="Filter diligence status"
          className="w-full sm:w-52"
        />
      </div>

      {isLoading ? (
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <div
              key={index}
              className="h-72 animate-pulse rounded-2xl border border-border bg-secondary/60"
            />
          ))}
        </div>
      ) : isError ? (
        <EmptyState
          icon={CircleAlert}
          title="The diligence queue could not be loaded"
          description={errorMessage}
          action={
            <Button
              variant="outline"
              onClick={() => refetch()}
              icon={<RefreshCw className="h-4 w-4" />}
            >
              Try again
            </Button>
          }
        />
      ) : records.length === 0 ? (
        <EmptyState
          icon={ClipboardCheck}
          title="No land diligence records match these filters"
          description="New land submissions will appear here once an owner completes their parcel profile."
        />
      ) : (
        <>
          <div className="mb-3 text-sm text-muted-foreground">
            Showing {Math.min((page - 1) * PAGE_SIZE + 1, total)}–
            {Math.min(page * PAGE_SIZE, total)} of {total} record{total === 1 ? '' : 's'}
          </div>
          <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
            {records.map((record, index) => (
              <LandDiligenceRecordCard
                key={record.propertyId}
                record={record}
                onReview={() => setActiveRecord(record)}
                delay={Math.min(index * 0.035, 0.2)}
              />
            ))}
          </div>
        </>
      )}

      {total > 0 && (
        <Pagination
          page={page}
          pageSize={PAGE_SIZE}
          total={total}
          onPageChange={setPage}
          className="mt-7"
        />
      )}

      <LandDiligenceReviewDialog
        key={activeRecord?.propertyId ?? 'closed'}
        record={activeRecord}
        onClose={() => setActiveRecord(null)}
        canApprove={canApprove}
        onApprove={(propertyId, input) => approveMutation.mutate({ propertyId, data: input })}
        onReject={(propertyId, input) => rejectMutation.mutate({ propertyId, data: input })}
        onRequestClarification={(propertyId, input) =>
          clarificationMutation.mutate({ propertyId, data: input })
        }
        isApproving={approveMutation.isPending}
        isRejecting={rejectMutation.isPending}
        isRequestingClarification={clarificationMutation.isPending}
      />
    </>
  );
}
