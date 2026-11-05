import type { ReplyLanguage } from '@/lib/replyLanguage';

export type FollowUpStep =
  | 'confirm_viewing'
  | 'after_viewing'
  | 'first_contact'
  | 'listing_gone'
  | 'offer_viewing'
  | 'check_in'
  | 'last_try';

/** One lead due a follow-up today, with the step code chose and a drafted message. */
export interface FollowUp {
  leadId: string;
  name: string;
  phone: string | null;
  email: string | null;
  step: FollowUpStep;
  why: string;
  stage: string;
  quietDays: number;
  listing: { title: string; price: string; area: string; available: boolean } | null;
  alternatives: { title: string; price: string; area: string }[];
  viewing: string | null;
  message: string;
  messageLanguage: ReplyLanguage;
  messageInEnglish: string | null;
}

/** GET /realtor/follow-ups */
export interface FollowUpPlan {
  overview: string;
  followUps: FollowUp[];
  onTrack: number;
  language: ReplyLanguage;
  source: 'ai' | 'heuristic';
  disclaimer: string;
}
