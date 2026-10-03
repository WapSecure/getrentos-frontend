/** Why a verified earner still can't withdraw (the backend names the real blocker). */
export const WITHHELD: Record<string, string> = {
  SCORE_BELOW_TIER3_MIN:
    'Your checks are complete, but your trust score is below what withdrawing needs. It restores itself as your trust profile builds.',
  OPEN_DISPUTE_AS_SUBJECT: 'A dispute open against you is holding withdrawals until it’s resolved.',
  OPEN_REVIEW_CASE:
    'A trust review on your account is still open. Withdrawals unlock when it closes.',
  FAILED_FINANCIAL_CHECK: 'An earlier financial check didn’t pass. Re-submit it to withdraw again.',
  ACCOUNT_RESTRICTED: 'Your account is restricted. Contact support to withdraw.',
};

/** What stops a withdrawal right now, in words, or null when nothing does. */
export function withdrawBlocker(s: {
  accountSet: boolean;
  canWithdraw: boolean;
  tier: number;
  withdrawTierRequired: number;
  withdrawWithheldReason?: string | null;
}): string | null {
  if (!s.accountSet) return 'Add a payout account to withdraw.';
  if (s.canWithdraw) return null;
  return (
    (s.withdrawWithheldReason && WITHHELD[s.withdrawWithheldReason]) ||
    `Withdrawing needs Trust Tier ${s.withdrawTierRequired}; you’re on ${s.tier}. Finish your verification to unlock it.`
  );
}
