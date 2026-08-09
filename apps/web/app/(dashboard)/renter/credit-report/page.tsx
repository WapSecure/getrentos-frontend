'use client';

import { useState } from 'react';
import { CreditReportingOptIn } from '@/components/renter/credit-reporting/CreditReportingOptIn';
import { CreditReportingDashboard } from '@/components/renter/credit-reporting/CreditReportingDashboard';
import { Toast } from '@/components/ui/Toast';
import type { CreditReportingProfile, ReportedPayment } from '@/types/credit-reporting';

const PAST_ON_TIME_PAYMENTS: Omit<ReportedPayment, 'id' | 'reportedDate'>[] = [
  { month: 'May 2024', amount: 200_000, status: 'on_time' },
  { month: 'June 2024', amount: 200_000, status: 'on_time' },
  { month: 'July 2024', amount: 200_000, status: 'on_time' },
];

const buildNextReportDate = (): string => {
  const date = new Date();
  date.setMonth(date.getMonth() + 1);
  date.setDate(1);
  return date.toISOString();
};

export default function RenterCreditReportPage() {
  const [profile, setProfile] = useState<CreditReportingProfile | null>(null);
  const [isEnrolling, setIsEnrolling] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const handleEnroll = () => {
    setIsEnrolling(true);

    window.setTimeout(() => {
      const now = new Date().toISOString();
      const reportedPayments: ReportedPayment[] = PAST_ON_TIME_PAYMENTS.map((payment, index) => ({
        ...payment,
        id: `rp_${index + 1}`,
        reportedDate: now,
      }));

      setProfile({
        status: 'enrolled',
        enrolledAt: now,
        consecutiveOnTimeMonths: reportedPayments.length,
        totalPaymentsReported: reportedPayments.length,
        nextReportDate: buildNextReportDate(),
        reportedPayments,
      });
      setIsEnrolling(false);
      setToast('You are enrolled — 3 months of on-time rent history have been reported.');
    }, 1800);
  };

  return (
    <>
      {toast && <Toast message={toast} variant="success" onClose={() => setToast(null)} />}

      {profile ? (
        <CreditReportingDashboard profile={profile} />
      ) : (
        <CreditReportingOptIn onEnroll={handleEnroll} isEnrolling={isEnrolling} />
      )}
    </>
  );
}
