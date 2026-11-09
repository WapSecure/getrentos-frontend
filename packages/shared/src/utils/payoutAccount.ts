/**
 * Payout account wording and checks shared by web and mobile, so every payout
 * form says the same thing about the same rule.
 */

/** "••••1234": only the last four digits, whether the API sent the full number or a masked one. */
export function maskAccountNumber(accountNumber?: string | null): string {
  const last4 = (accountNumber ?? '').replace(/\D/g, '').slice(-4);
  return last4 ? `••••${last4}` : '';
}

/** "GTBank ••••1234", for one line naming where money goes. */
export function payoutAccountLabel(account: {
  bankName?: string | null;
  accountNumber?: string | null;
}): string {
  return [account.bankName, maskAccountNumber(account.accountNumber)].filter(Boolean).join(' ');
}

/** Said before a change is saved (UX-29). */
export const PAYOUT_CHANGE_COOLDOWN_HINT =
  'Changing your bank details pauses payouts to the new account for 24 hours, and we’ll email you about it.';

/** Said about a transfer on its way. No promised time: banks vary (UX-32). */
export const PAYOUT_ARRIVAL_NOTE = 'We’ll show it here as soon as the bank confirms.';

/**
 * Said under a failed payout (UX-31). A failed payout keeps its money and
 * support sends it again to the account on file, after any change hold.
 */
export const PAYOUT_FAILED_NEXT_STEP =
  'The money is still yours. Check your payout account details are right; GetRentos support sends failed payouts again to the account on file.';

/** Where the name check on a bank account stands (UX-28). */
export type AccountLookupStatus =
  /** Bank or the 10 digits not complete yet. */
  | 'incomplete'
  | 'checking'
  | 'found'
  /** The bank has no such account: saving would fail, so it is blocked. */
  | 'not_found'
  /** The name could not be checked just now; the API still accepts the save and checks again. */
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

/**
 * Turns the name lookup into one state. Only a 400/404/422 means the bank has
 * no such account; anything else (the gateway down, too many lookups, no
 * network) means "not checked", which the API still lets through.
 */
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
  // Ready but nothing back yet: treat as still checking.
  return { status: 'checking', accountName: null, bankName, message: null };
}

/** Save waits for the name, unless it honestly could not be checked. */
export function lookupAllowsSave(lookup: AccountLookup): boolean {
  return lookup.status === 'found' || lookup.status === 'unchecked';
}

/** "Save ADA OBI’s account" once the name is known, so the payee is part of the action. */
export function saveAccountLabel(lookup: AccountLookup, fallback: string): string {
  return lookup.status === 'found' && lookup.accountName
    ? `Save ${lookup.accountName}’s account`
    : fallback;
}

/** What a step-up confirms when saving a payout account (UX-30). */
export function payoutAccountStepUpSummary(input: {
  bankName?: string | null;
  accountNumber: string;
  accountName?: string | null;
  /** Whose payout account it becomes, e.g. "Ada’s"; "your" by default. */
  owner?: string;
}): string {
  const where = payoutAccountLabel(input) || 'this bank account';
  return `Make ${where}${input.accountName ? ` (${input.accountName})` : ''} ${input.owner ?? 'your'} payout account`;
}

/** What a step-up confirms when withdrawing (UX-30). `amount` is already formatted. */
export function withdrawStepUpSummary(
  amount: string,
  account?: { bankName?: string | null; accountNumber?: string | null } | null
): string {
  const where = account ? payoutAccountLabel(account) : '';
  return `Withdraw ${amount} to ${where || 'your payout account'}`;
}
