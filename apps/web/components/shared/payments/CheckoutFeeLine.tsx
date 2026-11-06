import { formatCurrency } from '@/lib/format';

/**
 * "Card or bank fee ₦X · You pay ₦Y", shown before a payer leaves for
 * Paystack, so the total they see there is no surprise. Renders nothing until
 * the fee is known, or when there is none (simulated payments).
 */
export const CheckoutFeeLine = ({ fee, total }: { fee: number | null; total: number | null }) => {
  if (fee == null || total == null || fee <= 0) return null;
  return (
    <p className="text-xs text-muted-foreground">
      Card or bank fee {formatCurrency(fee)} · You pay {formatCurrency(total)}
    </p>
  );
};
