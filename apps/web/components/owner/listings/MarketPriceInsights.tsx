'use client';

import { TrendingUp, Sparkles } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@getrentos/ui';
import { formatCurrency } from '@/lib/format';
import { ownerService } from '@/services/ownerService';
import { unwrap } from '@/lib/apiHelpers';
import { ownerKeys } from '@/lib/queryKeys';

interface MarketPriceInsightsProps {
  city: string;
  onUseSuggestedPrice: (price: number) => void;
}

export const MarketPriceInsights = ({ city, onUseSuggestedPrice }: MarketPriceInsightsProps) => {
  const { data: insights } = useQuery({
    queryKey: ownerKeys.marketInsights(city),
    queryFn: () => unwrap(ownerService.getMarketInsights(city)),
    enabled: !!city.trim(),
  });

  const comparables = insights?.comparables ?? [];
  const { lowEstimate = 0, highEstimate = 0, suggested = 0 } = insights ?? {};

  if (!city.trim() || comparables.length === 0) {
    return (
      <div className="rounded-lg border border-border bg-secondary/40 p-3">
        <div className="flex items-center gap-1.5 mb-1">
          <TrendingUp className="w-3.5 h-3.5 text-muted-foreground" />
          <p className="text-xs font-medium text-foreground">Market insight</p>
        </div>
        <p className="text-xs text-muted-foreground">
          {city.trim()
            ? `No comparable completed sales near ${city} yet. Set a price based on your valuation.`
            : 'Enter a city to see recent comparable sales.'}
        </p>
      </div>
    );
  }

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
              {c.propertyType} · {c.size ? `${c.size} sqm · ` : ''}sold {c.soldMonthsAgo} mo
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
