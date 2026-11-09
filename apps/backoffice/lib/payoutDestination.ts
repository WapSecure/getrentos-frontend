import type { PayoutDestination } from '@/services/adminPayoutIssuesService';

export function payoutAccountLabel(d: PayoutDestination | null | undefined): string | null {
  if (!d) return null;
  const parts = [d.bankName, d.accountLast4 ? `••••${d.accountLast4}` : null].filter(Boolean);
  const label = parts.join(' ') || 'Payout account';
  return d.accountName ? `${label} (${d.accountName})` : label;
}

export function payoutDestinationSentence(d: PayoutDestination | null | undefined): string {
  const label = payoutAccountLabel(d);
  if (!label) return 'There is no payout account on file, so this will not send.';
  if (d?.accountChanged)
    return `It goes to ${label}. This account was changed after the payout was first sent: check the change was really theirs before you send.`;
  if (d?.accountChanged === false)
    return `It goes to ${label}, the same account it was first sent to.`;
  return `It goes to ${label}.`;
}
