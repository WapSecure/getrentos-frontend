'use client';

import { Info } from '@sureground/icons';
import { cn, indicativeAmount, indicativeRateLabel } from '@sureground/shared';
import { IconButton, Popover, PopoverBody, PopoverContent, PopoverTrigger } from '@sureground/ui';
import { useIndicativeRates } from '@/hooks/useIndicativeRates';

interface IndicativeAmountProps {
  /** Whole naira: a number, or a digit string for BIGINT amounts. */
  naira: number | string | bigint;
  /** GBP, USD, EUR or CAD; NGN or anything else renders nothing. */
  currency: string;
  labelDisplay?: 'inline' | 'popover';
  className?: string;
}

/** Display only: naira stays the price; renders nothing when the rate is unavailable or over 24 hours old. */
export const IndicativeAmount = ({
  naira,
  currency,
  labelDisplay = 'inline',
  className,
}: IndicativeAmountProps) => {
  const rates = useIndicativeRates();
  if (!rates.available || !rates.source || !rates.asOf) return null;
  const figure = indicativeAmount(
    naira,
    rates.rates[currency as keyof typeof rates.rates],
    currency
  );
  const label = indicativeRateLabel(rates.source, rates.asOf);
  if (!figure || !label) return null;

  if (labelDisplay === 'popover') {
    return (
      <p className={cn('flex items-center gap-1 text-sm text-muted-foreground', className)}>
        <span>{figure.text}</span>
        <Popover>
          <PopoverTrigger asChild>
            <IconButton label="About this figure" icon={<Info />} size="sm" />
          </PopoverTrigger>
          <PopoverContent align="start">
            <PopoverBody className="px-4 py-3 text-sm text-muted-foreground">{label}</PopoverBody>
          </PopoverContent>
        </Popover>
      </p>
    );
  }

  return (
    <div className={cn('text-muted-foreground', className)}>
      <p className="text-sm">{figure.text}</p>
      <p className="text-xs">{label}</p>
    </div>
  );
};
