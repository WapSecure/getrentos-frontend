import { apiFetch } from './client';
import type { ReplyLanguage } from '../replyLanguage';

/** One way forward, with what it brings in over the first year after the lease ends. */
export interface RenewalOption {
  key: 'renew' | 'relet';
  rentPerYear: string;
  firstYear: string;
  basis: string[];
}

/** Renew or re-let for a lease nearing its end. Every figure is worked out by Sureground. */
export interface RenewalAdvice {
  leaseId: string;
  tenantName: string;
  facts: {
    lease: {
      currentRent: string;
      period: 'per year' | 'per month';
      ends: string;
      daysLeft: number;
    };
    record: string[];
    market: string | null;
    increaseRule: { noticeDays: number; sendBy: string; noticePassed: boolean };
    suggested: { rent: string; increasePercent: number; reason: string; newEnd: string };
    options: RenewalOption[];
    comparison: string;
  };
  summary: string;
  /** Pre-fills the offer: rent in the lease's own period, end date as YYYY-MM-DD. */
  draft: {
    rentAmount: number;
    leaseEnd: string;
    message: string;
    messageLanguage: ReplyLanguage;
    messageInEnglish: string | null;
  };
  pendingOffer: { rentAmount: string; leaseEnd: string } | null;
  source: 'ai' | 'heuristic';
  disclaimer: string;
}

export const renewalAdviceApi = {
  get: (leaseId: string, language: ReplyLanguage = 'en') =>
    apiFetch<RenewalAdvice>(
      `/landlord/leases/${leaseId}/renewal-advice${language === 'en' ? '' : `?language=${language}`}`
    ),
};
