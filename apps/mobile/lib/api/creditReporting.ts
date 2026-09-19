import { apiFetch } from './client';

export const CREDIT_BUREAUS = [
  'CRC Credit Bureau',
  'FirstCentral Credit Bureau',
  'XDS Credit Bureau',
] as const;
export type CreditBureau = (typeof CREDIT_BUREAUS)[number];

export interface ReportedPayment {
  id: string;
  month: string;
  amount: number;
  reportedDate: string;
  status: 'on_time' | 'late';
}

export interface CreditReportingProfile {
  status: 'not_enrolled' | 'enrolled';
  enrolledAt?: string;
  bureau?: CreditBureau;
  consecutiveOnTimeMonths: number;
  totalPaymentsReported: number;
  nextReportDate: string;
  reportedPayments: ReportedPayment[];
}

export const creditReportingApi = {
  getProfile: () => apiFetch<CreditReportingProfile>('/renter/credit-reporting'),
  enroll: (bureau?: CreditBureau) =>
    apiFetch<CreditReportingProfile>('/renter/credit-reporting/enroll', {
      method: 'POST',
      body: { bureau },
    }),
};
