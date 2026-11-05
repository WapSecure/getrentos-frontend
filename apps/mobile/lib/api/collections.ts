import { apiFetch } from './client';
import type { ReplyLanguage } from '../replyLanguage';

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

/** Rent arrears across the landlord's properties, or dues at one estate. */
export type CollectionPlanSource = { kind: 'rent' } | { kind: 'dues'; estateId: string };

const query = (language: ReplyLanguage) => (language === 'en' ? '' : `?language=${language}`);

export const collectionsApi = {
  /** A step and a message per debtor; the messages in `language` when given. */
  plan: (source: CollectionPlanSource, language: ReplyLanguage = 'en') =>
    apiFetch<CollectionPlan>(
      source.kind === 'rent'
        ? `/landlord/collections/plan${query(language)}`
        : `/estate/${source.estateId}/collections/plan${query(language)}`
    ),
};
