export type CreditBureau = 'CRC Credit Bureau' | 'FirstCentral Credit Bureau' | 'XDS Credit Bureau';

export type CreditReportingStatus = 'not_enrolled' | 'enrolled';

export type ReportedPaymentStatus = 'on_time' | 'late';

export interface ReportedPayment {
  id: string;
  month: string;
  amount: number;
  reportedDate: string;
  status: ReportedPaymentStatus;
}

export interface CreditReportingProfile {
  status: CreditReportingStatus;
  enrolledAt?: string;
  consecutiveOnTimeMonths: number;
  totalPaymentsReported: number;
  nextReportDate: string;
  reportedPayments: ReportedPayment[];
}
