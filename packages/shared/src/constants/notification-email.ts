/**
 * Notification categories that have an email behind them.
 *
 * GetRentos emails only what somebody must not miss: money moving, offers,
 * verification results. Messages, visitors, reviews and the rest are in-app and
 * push only, so a settings screen shows an email switch for these categories
 * alone; one for anything else would control nothing.
 *
 * Mirrors EMAIL_CATEGORIES in the API (notification-email.policy.ts), where a
 * test checks every name against the notification types that are emailed.
 */
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

/** Whether switching email on or off for this category changes anything. */
export const categorySendsEmail = (category: string): boolean =>
  EMAILED_NOTIFICATION_CATEGORIES.includes(category);
