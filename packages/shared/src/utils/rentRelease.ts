/** What a held rent row asks of the tenant. Move-in happens once per lease, so only one row ever asks for it. */
export type RentReleaseAction = 'confirm-move-in' | 'release-now';

export interface RentReleasePayment {
  id: string;
  propertyId?: string;
  propertyName: string;
  status: string;
  escrowStatus: string;
  dueDate: string;
  /** From the API. Absent on older responses: a rent already released for the same home means the tenant moved in. */
  moveInConfirmed?: boolean;
}

/**
 * Per held payment: before move-in, only the oldest held rent of each home asks the tenant to confirm move-in (the
 * others release on schedule); after move-in, every held rent offers an early release instead.
 */
export function rentReleaseActions(
  payments: readonly RentReleasePayment[]
): Map<string, RentReleaseAction> {
  const homeOf = (p: RentReleasePayment) => p.propertyId ?? p.propertyName;
  const movedIn = new Set<string>();
  for (const p of payments) {
    if (p.moveInConfirmed || (p.moveInConfirmed === undefined && p.escrowStatus === 'released'))
      movedIn.add(homeOf(p));
  }
  const held = payments
    .filter((p) => p.status === 'paid' && p.escrowStatus === 'held')
    .sort((a, b) => a.dueDate.localeCompare(b.dueDate));
  const actions = new Map<string, RentReleaseAction>();
  const asked = new Set<string>();
  for (const p of held) {
    const home = homeOf(p);
    if (movedIn.has(home)) {
      actions.set(p.id, 'release-now');
    } else if (!asked.has(home)) {
      asked.add(home);
      actions.set(p.id, 'confirm-move-in');
    }
  }
  return actions;
}
