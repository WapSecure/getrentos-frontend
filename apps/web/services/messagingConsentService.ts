import { authFetch, safeCall, type ApiResponse } from '@/lib/apiHelpers';

export interface MessagingConsent {
  phoneEnding: string | null;
  phoneVerified: boolean;
  sms: boolean;
  whatsapp: boolean;
  consentedAt: string | null;
  /** They agreed for an older number; texts stop until they agree for this one. */
  numberChanged: boolean;
  /** The number to message for Ask Sureground on WhatsApp; null until the chat is set up. */
  whatsappChatNumber?: string | null;
}

export function getMessagingConsent(): Promise<ApiResponse<MessagingConsent>> {
  return safeCall(() => authFetch<MessagingConsent>('/users/me/messaging'));
}

export function setMessagingConsent(input: {
  sms: boolean;
  whatsapp: boolean;
}): Promise<ApiResponse<MessagingConsent>> {
  return safeCall(() =>
    authFetch<MessagingConsent>('/users/me/messaging', {
      method: 'PUT',
      body: JSON.stringify(input),
    })
  );
}
