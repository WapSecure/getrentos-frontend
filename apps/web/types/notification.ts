export interface NotificationMetadata {
  propertyId?: string;
  applicationId?: string;
  paymentId?: string;
  maintenanceId?: string;
  messageId?: string;
  leaseId?: string;
  trustScore?: number;
  amount?: number;
  sender?: string;
  [key: string]: string | number | boolean | undefined;
}

export interface Notification {
  id: string;
  type: 'application' | 'message' | 'payment' | 'maintenance' | 'lease' | 'system';
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
  action?: {
    label: string;
    url: string;
  };
  metadata?: NotificationMetadata;
}
