'use client';

import { useState, useEffect } from 'react';
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
import type { RenewalOffer } from '@/types/lease';
import { renterService, type Lease } from '@/services/renterService';

export default function LeasePage() {
  const [lease, setLease] = useState<Lease | null>(null);
  const [renewalOffer, setRenewalOffer] = useState<RenewalOffer | null>(null);
  const [rentIncreases, setRentIncreases] = useState<
    {
      date: string;
      oldAmount: number;
      newAmount: number;
      percentageChange: number;
      reason: string;
    }[]
  >([]);
  const [paymentReminders, setPaymentReminders] = useState<
    {
      id: string;
      dueDate: string;
      amount: number;
      propertyName: string;
      status: 'upcoming';
      daysRemaining: number;
    }[]
  >([]);

  useEffect(() => {
    const loadLeaseData = async () => {
      const [leaseRes, offerRes, increasesRes, remindersRes] = await Promise.all([
        renterService.getLease(),
        renterService.getRenewalOffer(),
        renterService.getRentIncreases(),
        renterService.getUpcomingPaymentReminders(),
      ]);
      if (leaseRes.success && leaseRes.data) setLease(leaseRes.data);
      if (offerRes.success && offerRes.data) setRenewalOffer(offerRes.data);
      if (increasesRes.success && increasesRes.data) setRentIncreases(increasesRes.data);
      if (remindersRes.success && remindersRes.data) setPaymentReminders(remindersRes.data);
    };
    loadLeaseData();
  }, []);

  const handleRespondToOffer = async (offerId: string, action: 'accept' | 'decline') => {
    const res = await renterService.respondToRenewalOffer(offerId, action);
    if (res.success && res.data) {
      setRenewalOffer(res.data);
      const leaseRes = await renterService.getLease();
      if (leaseRes.success && leaseRes.data) setLease(leaseRes.data);
    }
  };

  const handleRequestTermination = async (noticeDate: string, reason: string) => {
    await renterService.requestLeaseTermination(noticeDate, reason);
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
