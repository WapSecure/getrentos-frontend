import { apiDownload, apiFetch } from './client';

export interface LeaseLandlord {
  name: string;
  email: string;
  phone: string;
}

export interface LeaseDocument {
  name: string;
  type: string;
  uploadedAt: string;
  url: string;
}

export interface LeaseTimelineEvent {
  date: string;
  event: string;
  description: string;
}

export interface LeasePaymentHistoryItem {
  month: string;
  amount: number;
  status: 'paid' | 'pending' | 'overdue';
  date: string;
}

export interface Lease {
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
  landlord: LeaseLandlord;
  documents: LeaseDocument[];
  timeline: LeaseTimelineEvent[];
  paymentHistory: LeasePaymentHistoryItem[];
}

export interface PendingLease {
  id: string;
  propertyName: string;
  address: string;
  unitName: string;
  startDate: string;
  endDate: string;
  rentAmount: number;
  securityDeposit?: number;
  landlord: LeaseLandlord;
  tenantSigned: boolean;
  landlordSigned: boolean;
}

export interface RenewalOffer {
  id: string;
  offerDate: string;
  newRentAmount: number;
  increasePercentage: number;
  newEndDate: string;
  status: 'pending' | 'accepted' | 'declined';
  terms: string;
}

/** One step in the rent history for the current lease. */
export interface RentIncrease {
  date: string;
  oldAmount: number;
  newAmount: number;
  percentageChange: number;
  reason: string;
}

/** A rent payment that has not fallen due yet. */
export interface UpcomingPaymentReminder {
  id: string;
  dueDate: string;
  amount: number;
  propertyName: string;
  status: 'upcoming';
  daysRemaining: number;
}

export const leaseApi = {
  getLease: () => apiFetch<Lease>('/renter/lease'),

  getPendingLease: () => apiFetch<PendingLease | null>('/renter/lease/pending'),

  sign: (leaseId: string, signatureData: string) =>
    apiFetch<PendingLease>(`/renter/lease/${leaseId}/sign`, {
      method: 'POST',
      body: { signatureData },
    }),

  getRenewalOffer: () => apiFetch<RenewalOffer | null>('/renter/lease/renewal-offer'),

  respondRenewalOffer: (id: string, action: 'accept' | 'decline') =>
    apiFetch<RenewalOffer>(`/renter/lease/renewal-offer/${id}/respond`, {
      method: 'PATCH',
      body: { action },
    }),

  requestTermination: (noticeDate: string, reason: string) =>
    apiFetch<{ message: string }>('/renter/lease/termination-request', {
      method: 'POST',
      body: { noticeDate, reason },
    }),

  getRentIncreases: () => apiFetch<RentIncrease[]>('/renter/lease/rent-increases'),

  getUpcomingPaymentReminders: () =>
    apiFetch<UpcomingPaymentReminder[]>('/renter/lease/payment-reminders'),

  /** Streams the signed lease as a PDF; returns it base64-encoded to write to disk. */
  downloadPdf: () => apiDownload('/renter/lease/pdf'),
};
