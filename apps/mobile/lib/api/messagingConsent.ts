import { apiFetch } from './client';

/** Whether GetRentos may text this person, and the WhatsApp chat number when it is set up. */
export interface MessagingConsent {
  phoneEnding: string | null;
  phoneVerified: boolean;
  sms: boolean;
  whatsapp: boolean;
  consentedAt: string | null;
  /** They agreed for an older number; texts stop until they agree for this one. */
  numberChanged: boolean;
  /** The number to message for Ask GetRentos on WhatsApp; null until the chat is set up. */
  whatsappChatNumber?: string | null;
}

export const messagingConsentApi = {
  get: () => apiFetch<MessagingConsent>('/users/me/messaging'),
  set: (input: { sms: boolean; whatsapp: boolean }) =>
    apiFetch<MessagingConsent>('/users/me/messaging', { method: 'PUT', body: input }),
};
