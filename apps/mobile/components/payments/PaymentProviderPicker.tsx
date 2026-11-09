import { RadioGroup, type RadioOption } from '@sureground/ui-native';
import type { PaymentProviderChoice } from '@/hooks/usePaymentProviders';
import type { PaymentProvider } from '@/lib/api/paymentStatus';

export const PROVIDER_METHODS: Record<PaymentProvider, string> = {
  PAYSTACK: 'Card, bank transfer or USSD',
  MONNIFY: 'Card or bank transfer',
};

export function PaymentProviderPicker({
  choice,
  variant = 'list',
  hideLabel,
}: {
  choice: PaymentProviderChoice;
  variant?: 'list' | 'card';
  hideLabel?: boolean;
}) {
  if (!choice.canChoose) return null;
  const options: RadioOption<PaymentProvider>[] = choice.options.map((option) => ({
    value: option.provider,
    label: option.label,
    disabled: !option.available,
    description:
      !option.available && option.reason
        ? `${option.label} ${option.reason}.`
        : variant === 'card'
          ? PROVIDER_METHODS[option.provider]
          : undefined,
  }));
  return (
    <RadioGroup
      label={hideLabel ? undefined : 'Pay with'}
      accessibilityLabel="Pay with"
      variant={variant}
      value={choice.provider}
      onChange={choice.choose}
      options={options}
    />
  );
}
