import { Text } from '@sureground/ui-native';
import { useCheckoutFee } from '@/hooks/useCheckoutFee';
import type { PaymentProvider } from '@/lib/api/paymentStatus';
import { formatNaira } from '@/lib/format';

// Fees differ per company, so pass the payer's chosen provider. The payer covers the fee so the receiver gets the full amount.
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
