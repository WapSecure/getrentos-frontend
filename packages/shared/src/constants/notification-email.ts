// Must mirror EMAIL_CATEGORIES in the API (notification-email.policy.ts); an email switch for any
// other category would control nothing.
export const EMAILED_NOTIFICATION_CATEGORIES: readonly string[] = [
  'application',
  'applications',
  'offers',
  'payment',
  'payments',
  'escrow',
  'verification',
  'verifications',
  'system',
];

export const categorySendsEmail = (category: string): boolean =>
  EMAILED_NOTIFICATION_CATEGORIES.includes(category);
