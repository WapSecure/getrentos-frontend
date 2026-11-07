/**
 * Where a payout goes, in words, for the confirmation before money moves:
 * "Ada Obi, GTBank account ending 1234". Only the last four digits are shown,
 * whether the API sends the full number or a masked one.
 */
export function payoutDestination(account: {
  bankName?: string | null;
  accountNumber?: string | null;
  accountName?: string | null;
}): string {
  const last4 = (account.accountNumber ?? '').replace(/\D/g, '').slice(-4);
  const bank = [account.bankName, last4 ? `account ending ${last4}` : 'account']
    .filter(Boolean)
    .join(' ');
  return account.accountName ? `${account.accountName}, ${bank}` : bank;
}
