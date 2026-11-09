import { formatCurrency } from '@/lib/format';
import { useCheckoutFee } from '@/hooks/useCheckoutFee';
import type { PaymentProvider } from '@/types/payments';

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

/** Pass the payer's chosen `provider`: fees differ per company. */
export const CheckoutFeeNote = ({
  amount,
  provider,
  className,
}: {
  amount: number;
  provider?: PaymentProvider | null;
  className?: string;
}) => {
  const { fee, total } = useCheckoutFee(amount, provider);
  return <CheckoutFeeLine fee={fee} total={total} className={className} />;
};
