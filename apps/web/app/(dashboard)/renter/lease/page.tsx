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

interface Lease {
  id: string;
  propertyId: string;
  propertyName: string;
  address: string;
  startDate: string;
  endDate: string;
  rentAmount: number;
  securityDeposit: number;
  renewalTerms: string;
  status: 'active' | 'expiring' | 'expired';
  landlord: {
    name: string;
    email: string;
    phone: string;
  };
  documents: {
    name: string;
    type: string;
    uploadedAt: string;
    url: string;
  }[];
  timeline: {
    date: string;
    event: string;
    description: string;
  }[];
  paymentHistory: {
    month: string;
    amount: number;
    status: 'paid' | 'pending' | 'overdue';
    date: string;
  }[];
}

export default function LeasePage() {
  const [lease, setLease] = useState<Lease | null>(null);
  const [renewalOffer, setRenewalOffer] = useState<RenewalOffer | null>(null);

  const loadLeaseData = () => {
    const mockLease: Lease = {
      id: 'lease_001',
      propertyId: 'prop_001',
      propertyName: 'Modern Downtown Loft',
      address: '420 Main St, Ikeja, Lagos',
      startDate: '2024-03-01',
      endDate: '2025-03-01',
      rentAmount: 200000,
      securityDeposit: 400000,
      renewalTerms: 'Annual renewal with 5% increase',
      status: 'active',
      landlord: {
        name: 'Jane Smith',
        email: 'jane.smith@email.com',
        phone: '+1 234 567 8900',
      },
      documents: [
        {
          name: 'Lease Agreement',
          type: 'PDF',
          uploadedAt: '2024-02-15',
          url: '#',
        },
        {
          name: 'Move-in Inspection Report',
          type: 'PDF',
          uploadedAt: '2024-02-28',
          url: '#',
        },
        {
          name: 'Rent Receipt - March 2024',
          type: 'PDF',
          uploadedAt: '2024-03-01',
          url: '#',
        },
      ],
      timeline: [
        {
          date: '2024-02-15',
          event: 'Lease Signed',
          description: 'Digital lease agreement signed by both parties',
        },
        {
          date: '2024-02-28',
          event: 'Move-in Inspection',
          description: 'Move-in inspection completed',
        },
        {
          date: '2024-03-01',
          event: 'Lease Started',
          description: 'Lease period officially began',
        },
        {
          date: '2024-03-01',
          event: 'First Rent Payment',
          description: 'Rent payment for March 2024 processed',
        },
      ],
      paymentHistory: [
        { month: 'March 2024', amount: 200000, status: 'paid', date: '2024-03-01' },
        { month: 'April 2024', amount: 200000, status: 'paid', date: '2024-04-01' },
        { month: 'May 2024', amount: 200000, status: 'paid', date: '2024-05-01' },
        { month: 'June 2024', amount: 200000, status: 'pending', date: '2024-06-01' },
      ],
    };
    setLease(mockLease);
  };

  const loadRenewalOffer = () => {
    const mockRenewalOffer: RenewalOffer = {
      offerDate: '2024-12-15',
      newRentAmount: 210000,
      increasePercentage: 5,
      newEndDate: '2026-03-01',
      status: 'pending',
      terms: 'Annual renewal with 5% increase. New lease term: 12 months.',
    };
    setRenewalOffer(mockRenewalOffer);
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadLeaseData();
    loadRenewalOffer();
  }, []);

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

  const rentIncreases = [
    {
      date: '2023-03-01',
      oldAmount: 180000,
      newAmount: 200000,
      percentageChange: 11.1,
      reason: 'Annual increase',
    },
  ];

  const paymentReminders = [
    {
      id: '1',
      dueDate: '2024-07-01',
      amount: 200000,
      propertyName: 'Modern Downtown Loft',
      status: 'upcoming' as const,
      daysRemaining: 15,
    },
    {
      id: '2',
      dueDate: '2024-08-01',
      amount: 200000,
      propertyName: 'Modern Downtown Loft',
      status: 'upcoming' as const,
      daysRemaining: 45,
    },
  ];

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
          {renewalOffer && <LeaseRenewalOffer renewalOffer={renewalOffer} lease={lease} />}
          <LeasePaymentSchedule payments={lease.paymentHistory} />
          <LeaseDocuments documents={lease.documents} />
          <RentIncreaseHistory increases={rentIncreases} />
          <LeaseMoveOutChecklist />
          <LeaseTerminationRequest leaseId={lease.id} propertyName={lease.propertyName} />
        </div>
      </div>
    </>
  );
}
