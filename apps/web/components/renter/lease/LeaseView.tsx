'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { LeaseHeader } from '@/components/renter/lease/LeaseHeader';
import { LeaseStats } from '@/components/renter/lease/LeaseStats';
import { LeaseDetails } from '@/components/renter/lease/LeaseDetails';
import { LeaseTimeline } from '@/components/renter/lease/LeaseTimeline';
import { LeaseDocuments } from '@/components/renter/lease/LeaseDocuments';
import { LeaseRenewalOffer } from '@/components/renter/lease/LeaseRenewalOffer';
import { LeasePaymentSchedule } from '@/components/renter/lease/LeasePaymentSchedule';
import { LeaseMoveOutChecklist } from '@/components/renter/lease/LeaseMoveOutChecklist';
import { LeaseSummaryCard } from '@/components/renter/lease/LeaseSummaryCard';
import { RentIncreaseHistory } from '@/components/renter/lease/RentIncreaseHistory';
import { UpcomingPaymentReminders } from '@/components/renter/lease/UpcomingPaymentReminders';
import { LeaseTerminationRequest } from '@/components/renter/lease/LeaseTerminationRequest';
import { PendingLeaseCard } from '@/components/renter/lease/PendingLeaseCard';
import { FileText } from 'lucide-react';
import { PageErrorState, PageLoadingState, Toast, type ToastVariant } from '@getrentos/ui';
import { useState } from 'react';
import { renterService } from '@/services/renterService';
import { unwrap, unwrapOptional } from '@/lib/apiHelpers';
import { renterKeys } from '@/lib/queryKeys';

export const LeaseView = () => {
  const queryClient = useQueryClient();
  const [toast, setToast] = useState<{ message: string; variant: ToastVariant } | null>(null);

  // A renter whose lease is still awaiting signature has no active lease, no
  // renewal offer, no increases and no reminders yet: the API answers those with
  // 404. They are "nothing to report", not an outage — treating them as failures
  // replaced this whole tab with an error and hid the sign-your-lease card.
  const leaseQuery = useQuery({
    queryKey: renterKeys.lease,
    queryFn: () => unwrapOptional(renterService.getLease(), null),
  });
  const lease = leaseQuery.data ?? null;
  const pendingLeaseQuery = useQuery({
    queryKey: renterKeys.pendingLease,
    queryFn: () => unwrapOptional(renterService.getPendingLease(), null),
    // Always fetch this. It used to be gated on `!lease`, so as soon as the
    // renter's active lease resolved the query was disabled — and a disabled
    // query cannot refetch. Invalidation then marked it stale with no way to
    // refresh, leaving the sign-your-lease card showing the pre-signature state
    // for a tenant who had already signed.
  });
  const renewalOfferQuery = useQuery({
    queryKey: renterKeys.renewalOffer,
    // Empty 200 body from the API means "no offer"; see RenterLeaseRenewal.
    queryFn: async () => (await unwrapOptional(renterService.getRenewalOffer(), null)) ?? null,
  });
  const rentIncreasesQuery = useQuery({
    queryKey: renterKeys.rentIncreases,
    queryFn: () => unwrapOptional(renterService.getRentIncreases(), []),
  });
  const paymentRemindersQuery = useQuery({
    queryKey: renterKeys.upcomingPaymentReminders,
    queryFn: () => unwrapOptional(renterService.getUpcomingPaymentReminders(), []),
  });
  const pendingLease = pendingLeaseQuery.data ?? null;
  const renewalOffer = renewalOfferQuery.data ?? null;
  const rentIncreases = rentIncreasesQuery.data ?? [];
  const paymentReminders = paymentRemindersQuery.data ?? [];

  const respondToOfferMutation = useMutation({
    mutationFn: ({ offerId, action }: { offerId: string; action: 'accept' | 'decline' }) =>
      unwrap(renterService.respondToRenewalOffer(offerId, action)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: renterKeys.renewalOffer });
      queryClient.invalidateQueries({ queryKey: renterKeys.lease });
    },
  });

  const requestTerminationMutation = useMutation({
    mutationFn: ({ noticeDate, reason }: { noticeDate: string; reason: string }) =>
      unwrap(renterService.requestLeaseTermination(noticeDate, reason)),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: renterKeys.lease }),
  });

  const signLeaseMutation = useMutation({
    mutationFn: ({ id, signatureData }: { id: string; signatureData: string }) =>
      unwrap(renterService.signLease(id, signatureData)),
    onSuccess: (updated) => {
      queryClient.invalidateQueries({ queryKey: renterKeys.pendingLease });
      queryClient.invalidateQueries({ queryKey: renterKeys.lease });
      setToast({
        message:
          updated.status === 'awaiting_payment'
            ? 'Signature recorded. The lease now depends on your first payment into escrow.'
            : 'Your signature was recorded.',
        variant: 'success',
      });
    },
    onError: (error: Error) => {
      setToast({ message: error.message || 'Unable to sign this lease.', variant: 'error' });
    },
  });

  const handleRespondToOffer = async (offerId: string, action: 'accept' | 'decline') => {
    await respondToOfferMutation.mutateAsync({ offerId, action });
  };

  const handleRequestTermination = async (noticeDate: string, reason: string) => {
    await requestTerminationMutation.mutateAsync({ noticeDate, reason });
  };

  const handleSignLease = (id: string, signatureData: string) =>
    signLeaseMutation.mutate({ id, signatureData });

  // Rendered by both branches below. It used to live only in the no-active-lease
  // branch, so a tenant signing a second lease got no success or failure feedback
  // at all — including the error when a signature is rejected.
  const toastNode = toast ? (
    <Toast message={toast.message} variant={toast.variant} onClose={() => setToast(null)} />
  ) : null;

  const leaseQueries = [
    leaseQuery,
    pendingLeaseQuery,
    renewalOfferQuery,
    rentIncreasesQuery,
    paymentRemindersQuery,
  ];
  if (leaseQueries.some((query) => query.isLoading)) return <PageLoadingState />;
  if (leaseQueries.some((query) => query.isError)) {
    return (
      <PageErrorState
        title="Lease information is unavailable"
        description="We could not load your lease, renewal, or payment schedule. Please try again."
        onRetry={() => leaseQueries.forEach((query) => void query.refetch())}
        isRetrying={leaseQueries.some((query) => query.isFetching)}
      />
    );
  }

  if (!lease) {
    return (
      <>
        {pendingLease ? (
          <PendingLeaseCard
            lease={pendingLease}
            onSign={handleSignLease}
            isPending={signLeaseMutation.isPending}
          />
        ) : (
          <div className="text-center py-12">
            <div className="w-16 h-16 mx-auto mb-4 bg-secondary rounded-full flex items-center justify-center">
              <FileText className="w-8 h-8 text-muted-foreground" />
            </div>
            <h2 className="text-2xl font-bold text-foreground">No Active Lease</h2>
            <p className="text-muted-foreground mt-2">
              You don&apos;t have an active lease agreement at the moment.
            </p>
          </div>
        )}
        {toastNode}
      </>
    );
  }

  return (
    <>
      {/* A tenant can hold an executed lease and be signing another at the same
          time. The new one is shown first: left to the bottom of the page they
          would never see the payment it depends on, and it would lapse. */}
      {pendingLease && (
        <div className="mb-6">
          <PendingLeaseCard
            lease={pendingLease}
            onSign={handleSignLease}
            isPending={signLeaseMutation.isPending}
          />
        </div>
      )}

      <LeaseHeader lease={lease} renewalOffer={renewalOffer} />
      <LeaseStats lease={lease} />
      <LeaseSummaryCard lease={lease} />

      <div className="grid lg:grid-cols-3 gap-6 mt-6">
        <div className="lg:col-span-2 space-y-6">
          <LeaseDetails lease={lease} />
          <LeaseTimeline lease={lease} />
          <UpcomingPaymentReminders reminders={paymentReminders} />
        </div>
        <div className="space-y-6">
          {renewalOffer && (
            <LeaseRenewalOffer
              renewalOffer={renewalOffer}
              lease={lease}
              onRespond={handleRespondToOffer}
            />
          )}
          <LeasePaymentSchedule payments={lease.paymentHistory} />
          <LeaseDocuments documents={lease.documents} />
          <RentIncreaseHistory increases={rentIncreases} />
          <LeaseMoveOutChecklist />
          <LeaseTerminationRequest
            leaseId={lease.id}
            propertyName={lease.propertyName}
            onSubmit={handleRequestTermination}
          />
        </div>
      </div>
      {toastNode}
    </>
  );
};
