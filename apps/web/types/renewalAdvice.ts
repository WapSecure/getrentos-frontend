import type { ReplyLanguage } from '@/lib/replyLanguage';

/** One way forward, with what it brings in over the first year after the lease ends. */
export interface RenewalOption {
  key: 'renew' | 'relet';
  rentPerYear: string;
  firstYear: string;
  basis: string[];
}

/** GET /landlord/leases/:id/renewal-advice. Every figure is worked out by Sureground. */
export interface RenewalAdvice {
  leaseId: string;
  tenantName: string;
  property: string;
  unit: string;
  facts: {
    lease: {
      currentRent: string;
      period: 'per year' | 'per month';
      currentRentPerYear: string;
      ends: string;
      daysLeft: number;
    };
    record: string[];
    market: string | null;
    increaseRule: {
      maxIncreasePercent: number | null;
      noticeDays: number;
      sendBy: string;
      noticePassed: boolean;
    };
    suggested: {
      rent: string;
      rentPerYear: string;
      increasePercent: number;
      reason: string;
      newEnd: string;
    };
    options: RenewalOption[];
    comparison: string;
  };
  summary: string;
  /** Pre-fills the renewal offer: rent in the lease's own period, end date as YYYY-MM-DD. */
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
