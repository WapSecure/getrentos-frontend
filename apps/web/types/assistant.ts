import type { ReplyLanguage } from '@/lib/replyLanguage';

export interface AssistantTurn {
  role: 'user' | 'assistant';
  content: string;
}

export interface AssistantLink {
  label: string;
  path: string;
}

export interface AssistantReply {
  answer: string;
  links: AssistantLink[];
  suggestions: string[];
  source: 'ai' | 'heuristic';
  model: string | null;
  /** The language the answer is in; rule-based answers are English. */
  language?: ReplyLanguage;
  /** The language that was asked for. */
  requestedLanguage?: ReplyLanguage;
}

/** Kept for existing imports. */
export type RenterAssistantReply = AssistantReply;
