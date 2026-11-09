import { apiFetch } from './client';
import type { ReplyLanguage } from '../replyLanguage';

export type FollowUpStep =
  | 'confirm_viewing'
  | 'after_viewing'
  | 'first_contact'
  | 'listing_gone'
  | 'offer_viewing'
  | 'check_in'
  | 'last_try';

export interface FollowUp {
  leadId: string;
  name: string;
  phone: string | null;
  email: string | null;
  step: FollowUpStep;
  why: string;
  listing: { title: string; price: string; area: string; available: boolean } | null;
  alternatives: { title: string; price: string; area: string }[];
  message: string;
  messageLanguage: ReplyLanguage;
  messageInEnglish: string | null;
}

export interface FollowUpPlan {
  overview: string;
  followUps: FollowUp[];
  onTrack: number;
  language: ReplyLanguage;
  source: 'ai' | 'heuristic';
  disclaimer: string;
}

export const followUpsApi = {
  plan: (language: ReplyLanguage = 'en') =>
    apiFetch<FollowUpPlan>(
      `/realtor/follow-ups${language === 'en' ? '' : `?language=${language}`}`
    ),
  markContacted: (leadId: string) =>
    apiFetch<{ id: string }>(`/realtor/leads/${leadId}/contacted`, { method: 'POST' }),
};
