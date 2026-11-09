// The API's fallback name is "Your landlord".
export function depositHolderText(hold: { heldBySureground: boolean; heldBy?: string | null }) {
  if (hold.heldBySureground) {
    return 'Held by Sureground under Payment Protection, not by your landlord. It is only paid out as recorded here.';
  }
  const who = !hold.heldBy || /^your landlord$/i.test(hold.heldBy) ? 'your landlord' : hold.heldBy;
  return `Held by ${who}. Sureground keeps the record, and every deduction shows here.`;
}

export const noDeductionsText = (returned: boolean) =>
  returned
    ? 'None. Your full deposit was returned.'
    : 'None. Your full deposit is due back to you.';
