'use client';

import { Field, RadioGroup, type RadioOption } from '@sureground/ui';
import type { PaymentProviderChoice } from '@/hooks/usePaymentProviders';
import type { PaymentProvider } from '@/types/payments';

export const PROVIDER_METHODS: Record<PaymentProvider, string> = {
  PAYSTACK: 'Card, bank transfer or USSD',
  MONNIFY: 'Card or bank transfer',
};

export function PaymentProviderPicker({
  choice,
  disabled,
  className,
  variant = 'inline',
  hideLabel,
}: {
  choice: PaymentProviderChoice;
  disabled?: boolean;
  className?: string;
  variant?: 'inline' | 'card';
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
  const group = (
    <RadioGroup
      aria-label="Pay with"
      value={choice.provider}
      onValueChange={choice.choose}
      options={options}
      variant={variant === 'card' ? 'card' : 'list'}
      columns={variant === 'card' ? 2 : undefined}
      orientation={variant === 'card' ? undefined : 'horizontal'}
      disabled={disabled}
    />
  );
  if (hideLabel) return <div className={className}>{group}</div>;
  return (
    <Field label="Pay with" className={className}>
      {group}
    </Field>
  );
}
