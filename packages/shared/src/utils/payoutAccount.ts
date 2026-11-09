export function maskAccountNumber(accountNumber?: string | null): string {
  const last4 = (accountNumber ?? '').replace(/\D/g, '').slice(-4);
  return last4 ? `••••${last4}` : '';
}

export function payoutAccountLabel(account: {
  bankName?: string | null;
  accountNumber?: string | null;
}): string {
  return [account.bankName, maskAccountNumber(account.accountNumber)].filter(Boolean).join(' ');
}

export interface PayoutSentTo {
  bankName: string | null;
  accountLast4: string;
}

export function payoutSentToLabel(sentTo?: PayoutSentTo | null): string | null {
  if (!sentTo?.accountLast4) return null;
  return `To ${[sentTo.bankName, `••••${sentTo.accountLast4}`].filter(Boolean).join(' ')}`;
}

export const PAYOUT_CHANGE_COOLDOWN_HINT =
  'Changing your bank details pauses payouts to the new account for 24 hours, and we’ll email you about it.';

// No promised time: banks vary.
export const PAYOUT_ARRIVAL_NOTE = 'We’ll show it here as soon as the bank confirms.';

export const PAYOUT_FAILED_NEXT_STEP =
  'The money is still yours. Check your payout account details are right; Sureground support sends failed payouts again to the account on file.';

export type AccountLookupStatus =
  | 'incomplete'
  | 'checking'
  | 'found'
  // Saving would fail, so it is blocked.
  | 'not_found'
  // The API still accepts the save and checks the name again.
  | 'unchecked';

export interface AccountLookup {
  status: AccountLookupStatus;
  accountName: string | null;
  bankName: string | null;
  message: string | null;
}

export const INCOMPLETE_ACCOUNT_LOOKUP: AccountLookup = {
  status: 'incomplete',
  accountName: null,
  bankName: null,
  message: null,
};

export const ACCOUNT_NAME_UNCHECKED =
  'We couldn’t check the name on this account just now. You can still save it; we check it again when you do.';

// Only 400/404/422 means no such account; any other failure is "unchecked", which the API lets through.
export function toAccountLookup(input: {
  ready: boolean;
  checking: boolean;
  accountName?: string | null;
  bankName?: string | null;
  error?: { status?: number; message?: string } | null;
}): AccountLookup {
  const bankName = input.bankName ?? null;
  if (!input.ready) return INCOMPLETE_ACCOUNT_LOOKUP;
  if (input.checking) return { status: 'checking', accountName: null, bankName, message: null };
  if (input.accountName) {
    return { status: 'found', accountName: input.accountName, bankName, message: null };
  }
  if (input.error) {
    const status = input.error.status ?? 0;
    if (status === 400 || status === 404 || status === 422) {
      return {
        status: 'not_found',
        accountName: null,
        bankName,
        message:
          input.error.message ||
          'No account with that number was found at that bank. Check both and try again.',
      };
    }
    return { status: 'unchecked', accountName: null, bankName, message: ACCOUNT_NAME_UNCHECKED };
  }
  return { status: 'checking', accountName: null, bankName, message: null };
}

export function lookupAllowsSave(lookup: AccountLookup): boolean {
  return lookup.status === 'found' || lookup.status === 'unchecked';
}

export function saveAccountLabel(lookup: AccountLookup, fallback: string): string {
  return lookup.status === 'found' && lookup.accountName
    ? `Save ${lookup.accountName}’s account`
    : fallback;
}

export function payoutAccountStepUpSummary(input: {
  bankName?: string | null;
  accountNumber: string;
  accountName?: string | null;
  owner?: string;
}): string {
  const where = payoutAccountLabel(input) || 'this bank account';
  return `Make ${where}${input.accountName ? ` (${input.accountName})` : ''} ${input.owner ?? 'your'} payout account`;
}

// `amount` is already formatted.
export function withdrawStepUpSummary(
  amount: string,
  account?: { bankName?: string | null; accountNumber?: string | null } | null
): string {
  const where = account ? payoutAccountLabel(account) : '';
  return `Withdraw ${amount} to ${where || 'your payout account'}`;
}
