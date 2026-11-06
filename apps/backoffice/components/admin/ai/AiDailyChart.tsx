'use client';

import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  type TooltipProps,
} from 'recharts';
import { Card } from '@getrentos/ui';
import type { AiUsageDay } from '@/types/admin';

/** "6 Nov" from a Lagos YYYY-MM-DD day, without the viewer's time zone shifting it. */
export function shortDay(day: string): string {
  const [y, m, d] = day.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d)).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    timeZone: 'UTC',
  });
}

/** USD vendor spend, labelled as USD (the product itself shows only Naira). */
export function usd(amount: number): string {
  return `USD ${amount.toFixed(amount < 1 ? 4 : 2)}`;
}

/** Axis steps for small sums need more places, or 0.005 and 0.015 both read 0.01. */
const axisUsd = (v: number) => (v === 0 ? '0' : v.toFixed(v < 0.1 ? 3 : v < 1 ? 2 : 0));

const DayTooltip = ({ active, payload }: TooltipProps<number, string>) => {
  const d = payload?.[0]?.payload as AiUsageDay | undefined;
  if (!active || !d) return null;
  return (
    <div className="rounded-lg border border-border bg-card px-3 py-2 text-xs shadow-lg">
      <p className="font-medium text-muted-foreground">{shortDay(d.day)}</p>
      <p className="text-sm font-semibold text-foreground">{usd(d.costUsd)}</p>
      <p className="text-muted-foreground">
        {d.calls} call{d.calls === 1 ? '' : 's'} · {d.fellBack} answered by the rules · {d.dropped}{' '}
        part{d.dropped === 1 ? '' : 's'} dropped
      </p>
    </div>
  );
};

/** Spend per Lagos day over the chosen period; the tooltip carries the day's calls, fallbacks and drops. */
export function AiDailyChart({ daily }: { daily: AiUsageDay[] }) {
  const total = daily.reduce((n, d) => n + d.costUsd, 0);
  const busiest = daily.reduce<AiUsageDay | null>(
    (b, d) => (!b || d.costUsd > b.costUsd ? d : b),
    null
  );
  return (
    <Card className="p-5">
      <h2 className="font-semibold text-foreground">Spend per day</h2>
      <p className="mt-0.5 text-xs text-muted-foreground">
        Lagos days. Point at a day for its calls, rules fallbacks and dropped parts.
      </p>
      {total === 0 ? (
        <p className="py-12 text-center text-sm text-muted-foreground">No spend in this period.</p>
      ) : (
        <div
          className="mt-4 h-52"
          role="img"
          aria-label={`AI spend per day: ${usd(total)} in ${daily.length} days${busiest ? `, highest on ${shortDay(busiest.day)} at ${usd(busiest.costUsd)}` : ''}.`}
        >
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={daily} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
              <CartesianGrid
                vertical={false}
                stroke="currentColor"
                className="text-muted-foreground/20"
              />
              <XAxis
                dataKey="day"
                tickFormatter={shortDay}
                axisLine={false}
                tickLine={false}
                minTickGap={16}
                tick={{ fontSize: 12, fill: 'currentColor' }}
                className="text-muted-foreground"
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                width={56}
                tick={{ fontSize: 12, fill: 'currentColor' }}
                className="text-muted-foreground"
                tickFormatter={axisUsd}
              />
              <Tooltip content={<DayTooltip />} cursor={{ fill: 'var(--accent)', opacity: 0.5 }} />
              <Bar dataKey="costUsd" fill="var(--primary)" radius={[4, 4, 0, 0]} maxBarSize={28} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </Card>
  );
}
