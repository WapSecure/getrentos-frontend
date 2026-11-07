import { RadioGroup, type RadioOption } from '@getrentos/ui-native';
import type { PaymentProviderChoice } from '@/hooks/usePaymentProviders';
import type { PaymentProvider } from '@/lib/api/paymentStatus';

/** The ways each company lets a payer pay, as their checkout offers them. */
export const PROVIDER_METHODS: Record<PaymentProvider, string> = {
  PAYSTACK: 'Card, bank transfer or USSD',
  MONNIFY: 'Card or bank transfer',
};

/**
 * "Pay with: Paystack / Monnify", so a payer can switch when one company is
 * down. A company that cannot take payments right now is shown but cannot be
 * chosen, with why ("Monnify is switched off for now"). Renders nothing only
 * when GetRentos works with a single company: there is nothing to choose.
 */
export function PaymentProviderPicker({
  choice,
  variant = 'list',
  hideLabel,
}: {
  choice: PaymentProviderChoice;
  /** `card`: a large row per company with how you can pay, for a pay sheet. `list`: compact. */
  variant?: 'list' | 'card';
  /** Leave out the "Pay with" label when the surrounding step already says it. */
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
