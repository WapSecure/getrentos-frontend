export type WhatsAppConnectionStatus = 'disconnected' | 'awaiting_code' | 'connected';

export interface WhatsAppNotificationPreference {
  id: string;
  label: string;
  enabled: boolean;
}
