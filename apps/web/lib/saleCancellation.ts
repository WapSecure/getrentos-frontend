import type { EscrowSaleTransaction } from '@/types/owner';

/** A refunded sale where no money moved: "Refunded" would claim a payment that never happened. */
export function cancelledBeforePayment(
  transaction: Pick<EscrowSaleTransaction, 'escrowStatus' | 'milestones'>
): boolean {
  return (
    transaction.escrowStatus === 'refunded' &&
    transaction.milestones.length > 0 &&
    transaction.milestones.every((milestone) => !milestone.completed)
  );
}
