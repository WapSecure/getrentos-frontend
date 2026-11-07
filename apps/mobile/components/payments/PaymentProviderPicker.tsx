import { RadioGroup, type RadioOption } from '@getrentos/ui-native';
import type { PaymentProviderChoice } from '@/hooks/usePaymentProviders';
import type { PaymentProvider } from '@/lib/api/paymentStatus';

/**
 * "Pay with: Paystack / Monnify", so a payer can switch when one company is
 * down. A company that cannot take payments right now is shown but cannot be
 * chosen, with why ("Monnify is switched off for now"). Renders nothing when
 * only one company can take it: there is nothing to choose.
 */
export function PaymentProviderPicker({ choice }: { choice: PaymentProviderChoice }) {
  if (!choice.canChoose) return null;
  const options: RadioOption<PaymentProvider>[] = choice.options.map((option) => ({
    value: option.provider,
    label: option.label,
    disabled: !option.available,
    description:
      !option.available && option.reason ? `${option.label} ${option.reason}.` : undefined,
  }));
  return (
    <RadioGroup
      label="Pay with"
      value={choice.provider}
      onChange={choice.choose}
      options={options}
    />
  );
}
