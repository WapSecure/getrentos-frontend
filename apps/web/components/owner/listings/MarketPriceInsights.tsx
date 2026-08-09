'use client';

import { TrendingUp, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { formatCurrency } from '@/lib/format';

interface ComparableSale {
  propertyType: string;
  city: string;
  soldPrice: number;
  size: number;
  soldMonthsAgo: number;
}

const comparablesByCity: Record<string, ComparableSale[]> = {
  'victoria island': [
    {
      propertyType: 'Apartment',
      city: 'Victoria Island',
      soldPrice: 138_000_000,
      size: 195,
      soldMonthsAgo: 2,
    },
    {
      propertyType: 'Apartment',
      city: 'Victoria Island',
      soldPrice: 151_000_000,
      size: 220,
      soldMonthsAgo: 4,
    },
    {
      propertyType: 'Apartment',
      city: 'Victoria Island',
      soldPrice: 144_500_000,
      size: 205,
      soldMonthsAgo: 1,
    },
  ],
  lekki: [
    { propertyType: 'Duplex', city: 'Lekki', soldPrice: 88_000_000, size: 300, soldMonthsAgo: 3 },
    { propertyType: 'Duplex', city: 'Lekki', soldPrice: 96_500_000, size: 335, soldMonthsAgo: 1 },
    { propertyType: 'Duplex', city: 'Lekki', soldPrice: 91_000_000, size: 310, soldMonthsAgo: 5 },
  ],
  ikoyi: [
    {
      propertyType: 'Bungalow',
      city: 'Ikoyi',
      soldPrice: 198_000_000,
      size: 410,
      soldMonthsAgo: 2,
    },
    {
      propertyType: 'Bungalow',
      city: 'Ikoyi',
      soldPrice: 225_000_000,
      size: 460,
      soldMonthsAgo: 4,
    },
    {
      propertyType: 'Bungalow',
      city: 'Ikoyi',
      soldPrice: 212_000_000,
      size: 430,
      soldMonthsAgo: 6,
    },
  ],
};

const defaultComparables: ComparableSale[] = [
  { propertyType: 'Property', city: 'Lagos', soldPrice: 72_000_000, size: 240, soldMonthsAgo: 3 },
  { propertyType: 'Property', city: 'Lagos', soldPrice: 79_500_000, size: 260, soldMonthsAgo: 2 },
  { propertyType: 'Property', city: 'Lagos', soldPrice: 75_800_000, size: 250, soldMonthsAgo: 5 },
];

interface MarketPriceInsightsProps {
  city: string;
  onUseSuggestedPrice: (price: number) => void;
}

export const MarketPriceInsights = ({ city, onUseSuggestedPrice }: MarketPriceInsightsProps) => {
  const comparables = comparablesByCity[city.trim().toLowerCase()] || defaultComparables;
  const prices = comparables.map((c) => c.soldPrice);
  const lowEstimate = Math.min(...prices);
  const highEstimate = Math.max(...prices);
  const suggested =
    Math.round(prices.reduce((sum, p) => sum + p, 0) / prices.length / 500_000) * 500_000;

  return (
    <div className="rounded-lg border border-primary/30 bg-accent p-3">
      <div className="flex items-center gap-1.5 mb-2">
        <TrendingUp className="w-3.5 h-3.5 text-primary" />
        <p className="text-xs font-medium text-foreground">
          Market insight: recent sales near {city}
        </p>
      </div>

      <div className="space-y-1.5 mb-3">
        {comparables.map((c, i) => (
          <div key={i} className="flex items-center justify-between text-xs text-muted-foreground">
            <span>
              {c.propertyType} · {c.size} sqm · sold {c.soldMonthsAgo} mo
              {c.soldMonthsAgo === 1 ? '' : 's'} ago
            </span>
            <span className="font-medium text-foreground">
              {formatCurrency(c.soldPrice, { compact: true })}
            </span>
          </div>
        ))}
      </div>

      <div className="flex items-center justify-between pt-2 border-t border-primary/20">
        <p className="text-xs text-muted-foreground">
          Suggested range{' '}
          <span className="font-semibold text-foreground">
            {formatCurrency(lowEstimate, { compact: true })} –{' '}
            {formatCurrency(highEstimate, { compact: true })}
          </span>
        </p>
        <Button
          variant="outline"
          size="xs"
          className="gap-1"
          onClick={() => onUseSuggestedPrice(suggested)}
        >
          <Sparkles className="w-3 h-3" />
          Use {formatCurrency(suggested, { compact: true })}
        </Button>
      </div>
    </div>
  );
};
