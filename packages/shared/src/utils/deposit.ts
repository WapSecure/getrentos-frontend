/**
 * How a tenant's deposit is described, the same on web and mobile.
 */

/** Who holds the deposit, as a sentence. The API's fallback name is "Your landlord". */
export function depositHolderText(hold: { heldByGetRentos: boolean; heldBy?: string | null }) {
  if (hold.heldByGetRentos) {
    return 'Held by GetRentos under Payment Protection, not by your landlord. It is only paid out as recorded here.';
  }
  const who = !hold.heldBy || /^your landlord$/i.test(hold.heldBy) ? 'your landlord' : hold.heldBy;
  return `Held by ${who}. GetRentos keeps the record, and every deduction shows here.`;
}

/** What to say when nothing was deducted, before and after the deposit is returned. */
export const noDeductionsText = (returned: boolean) =>
  returned
    ? 'None. Your full deposit was returned.'
    : 'None. Your full deposit is due back to you.';
