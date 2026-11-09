/**
 * How staff reach platform operations. Set in the environment; anything left
 * empty is not shown, so the back office never offers a number that rings nobody.
 *
 *   NEXT_PUBLIC_OPS_EMAIL          defaults to the monitored support inbox
 *   NEXT_PUBLIC_OPS_ONCALL_PHONE   e.g. +2348012345678 (on-call escalation line)
 *   NEXT_PUBLIC_OPS_ONCALL_HOURS   e.g. "24/7 for critical and fraud cases"
 */
export const OPS_CONTACT = {
  email: process.env.NEXT_PUBLIC_OPS_EMAIL?.trim() || 'support@getsureground.io',
  phone: process.env.NEXT_PUBLIC_OPS_ONCALL_PHONE?.trim() || '',
  hours: process.env.NEXT_PUBLIC_OPS_ONCALL_HOURS?.trim() || '',
};

export const telLink = (phone: string) => `tel:${phone.replace(/[^\d+]/g, '')}`;
