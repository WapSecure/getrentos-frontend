import { formatCurrency } from '@/lib/format';
import { useCheckoutFee } from '@/hooks/useCheckoutFee';

/**
 * "Card or bank fee ₦X · You pay ₦Y", shown before a payer leaves for
 * Paystack, so the total they see there is no surprise. Renders nothing until
 * the fee is known, or when there is none (simulated payments).
 */
export const CheckoutFeeLine = ({
  fee,
  total,
  className = '',
}: {
  fee: number | null;
  total: number | null;
  className?: string;
}) => {
  if (fee == null || total == null || fee <= 0) return null;
  return (
    <p className={`text-xs text-muted-foreground ${className}`}>
      Card or bank fee {formatCurrency(fee)} · You pay {formatCurrency(total)}
    </p>
  );
};

/** The same line for a payment of `amount` naira, fetching the fee itself: for a pay button in a list. */
export const CheckoutFeeNote = ({ amount, className }: { amount: number; className?: string }) => {
  const { fee, total } = useCheckoutFee(amount);
  return <CheckoutFeeLine fee={fee} total={total} className={className} />;
};
