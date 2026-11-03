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
}

/** Kept for existing imports. */
export type RenterAssistantReply = AssistantReply;
