import { apiFetch } from './client';

export interface Feedback {
  id: string;
  rating?: number;
  message: string;
  createdAt: string;
}

export interface SubmitFeedbackInput {
  /** 1–5; omitted when the renter only leaves a note. */
  rating?: number;
  message: string;
}

export const feedbackApi = {
  submit: (input: SubmitFeedbackInput) =>
    apiFetch<Feedback>('/renter/feedback', { method: 'POST', body: input }),
};
