import type { ReplyLanguage } from '@/lib/replyLanguage';

export type CollectionStage = 'reminder' | 'instalments' | 'formal_demand';

/** One tenant or household in a collection plan. */
export interface CollectionDebtor {
  key: string;
  /** leaseId (rent) or householdId (dues). */
  ref: string;
  label: string;
  owed: string;
  charges: number;
  oldestDue: string;
  daysOverdue: number;
  paymentPattern: string;
  stage: CollectionStage;
  reasons: string[];
  instalments: { amount: string; due: string }[] | null;
  nextNotice: string | null;
  message: string;
  messageLanguage?: ReplyLanguage;
  messageInEnglish?: string | null;
}

export interface CollectionPlan {
  kind: 'rent' | 'dues';
  overview: string;
  totals: { owed: string; debtors: number; byStage: Record<CollectionStage, number> };
  debtors: CollectionDebtor[];
  language?: ReplyLanguage;
  source: 'ai' | 'heuristic';
  disclaimer: string;
}
