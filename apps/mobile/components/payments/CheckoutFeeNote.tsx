import { Text } from '@getrentos/ui-native';
import { useCheckoutFee } from '@/hooks/useCheckoutFee';
import type { PaymentProvider } from '@/lib/api/paymentStatus';
import { formatNaira } from '@/lib/format';

/**
 * "Card or bank fee ₦X · You pay ₦Y" for a payment of `amount` naira, shown
 * beside a pay button so the total on the payment page is no surprise. The
 * payer covers the fee so the landlord, seller or estate gets the full amount.
 * Pass the payer's chosen `provider`: fees differ per company.
 * Renders nothing until the fee is known, or when there is none.
 */
export function CheckoutFeeNote({
  amount,
  provider,
}: {
  amount: number;
  provider?: PaymentProvider | null;
}) {
  const { fee, total } = useCheckoutFee(amount, provider);
  if (fee == null || total == null || fee <= 0) return null;
  return (
    <Text variant="caption" color="mutedForeground">
      Card or bank fee {formatNaira(fee)} · You pay {formatNaira(total)}
    </Text>
  );
}
