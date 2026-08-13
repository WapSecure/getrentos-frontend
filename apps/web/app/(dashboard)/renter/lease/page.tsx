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
import { FileText } from 'lucide-react';
import { renterService } from '@/services/renterService';
import { unwrap } from '@/lib/apiHelpers';
import { renterKeys } from '@/lib/queryKeys';

export default function LeasePage() {
  const queryClient = useQueryClient();

  const { data: lease = null } = useQuery({
    queryKey: renterKeys.lease,
    queryFn: () => unwrap(renterService.getLease()),
  });
  const { data: renewalOffer = null } = useQuery({
    queryKey: renterKeys.renewalOffer,
    queryFn: () => unwrap(renterService.getRenewalOffer()),
  });
  const { data: rentIncreases = [] } = useQuery({
    queryKey: renterKeys.rentIncreases,
    queryFn: () => unwrap(renterService.getRentIncreases()),
  });
  const { data: paymentReminders = [] } = useQuery({
    queryKey: renterKeys.upcomingPaymentReminders,
    queryFn: () => unwrap(renterService.getUpcomingPaymentReminders()),
  });

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

  const handleRespondToOffer = async (offerId: string, action: 'accept' | 'decline') => {
    await respondToOfferMutation.mutateAsync({ offerId, action });
  };

  const handleRequestTermination = async (noticeDate: string, reason: string) => {
    await requestTerminationMutation.mutateAsync({ noticeDate, reason });
  };

  if (!lease) {
    return (
      <div className="text-center py-12">
        <div className="w-16 h-16 mx-auto mb-4 bg-secondary rounded-full flex items-center justify-center">
          <FileText className="w-8 h-8 text-muted-foreground" />
        </div>
        <h2 className="text-2xl font-bold text-foreground">No Active Lease</h2>
        <p className="text-muted-foreground mt-2">
          You don&apos;t have an active lease agreement at the moment.
        </p>
      </div>
    );
  }

  return (
    <>
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
    </>
  );
}
