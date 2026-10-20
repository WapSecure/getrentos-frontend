'use client';

import { useMemo, useState } from 'react';
import { SearchX } from 'lucide-react';
import { Checkbox, EmptyState, Select } from '@getrentos/ui';
import { formatCurrency } from '@/lib/format';
import { LAND_PLOT_STATUS_LABELS, type LandPlot, type LandPlotStatus } from '@/types/landBuyer';
import { PLOT_STATUS_STYLES, plotLabel } from './landSaleLogic';

const STATUS_FILTERS: { value: string; label: string }[] = [
  { value: 'AVAILABLE', label: 'Available only' },
  { value: '', label: 'All plots' },
  { value: 'RESERVED', label: 'Reserved' },
  { value: 'TAKEN', label: 'Sold or under installment' },
];

const TAKEN: LandPlotStatus[] = ['UNDER_INSTALLMENT', 'SOLD', 'ALLOCATED'];

export const PlotStatusLegend = () => (
  <ul className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground" aria-label="Legend">
    {(['AVAILABLE', 'RESERVED', 'UNDER_INSTALLMENT', 'SOLD', 'ALLOCATED'] as const).map((s) => (
      <li key={s} className="inline-flex items-center gap-1.5">
        <span className={`h-2.5 w-2.5 rounded-sm ${PLOT_STATUS_STYLES[s].swatch}`} aria-hidden />
        {LAND_PLOT_STATUS_LABELS[s]}
      </li>
    ))}
  </ul>
);

/**
 * Every plot as a button coloured by status, with availability filters. This
 * is the accessible way to pick a plot, and the only one when the developer
 * has not uploaded plot outlines.
 */
export const PlotGrid = ({
  plots,
  selectedId,
  onSelect,
}: {
  plots: LandPlot[];
  selectedId?: string | null;
  onSelect: (plot: LandPlot) => void;
}) => {
  const [status, setStatus] = useState('AVAILABLE');
  const [block, setBlock] = useState('');
  const [cornerOnly, setCornerOnly] = useState(false);

  const blocks = useMemo(
    () => Array.from(new Set(plots.map((p) => p.block).filter((b): b is string => !!b))).sort(),
    [plots]
  );

  const visible = plots.filter((plot) => {
    if (status === 'TAKEN' && !TAKEN.includes(plot.status)) return false;
    if (status && status !== 'TAKEN' && plot.status !== status) return false;
    if (block && plot.block !== block) return false;
    if (cornerOnly && !plot.isCorner) return false;
    return true;
  });

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-3">
        <div className="w-full sm:w-52">
          <Select
            value={status}
            onValueChange={setStatus}
            options={STATUS_FILTERS}
            ariaLabel="Plot availability"
          />
        </div>
        {blocks.length > 1 && (
          <div className="w-full sm:w-40">
            <Select
              value={block}
              onValueChange={setBlock}
              options={[
                { value: '', label: 'All blocks' },
                ...blocks.map((b) => ({ value: b, label: `Block ${b}` })),
              ]}
              ariaLabel="Block"
            />
          </div>
        )}
        <Checkbox checked={cornerOnly} onCheckedChange={setCornerOnly} label="Corner plots" />
        <span className="text-xs text-muted-foreground sm:ml-auto" aria-live="polite">
          {visible.length} of {plots.length} plots
        </span>
      </div>

      {visible.length === 0 ? (
        <EmptyState icon={SearchX} title="No plots match these filters." size="compact" />
      ) : (
        <ul className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
          {visible.map((plot) => {
            const selected = plot.id === selectedId;
            return (
              <li key={plot.id}>
                <button
                  type="button"
                  onClick={() => onSelect(plot)}
                  aria-pressed={selected}
                  className={`w-full rounded-xl border p-3 text-left text-xs transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
                    PLOT_STATUS_STYLES[plot.status].cell
                  } ${selected ? 'ring-2 ring-primary' : ''}`}
                >
                  <span className="block truncate text-sm font-semibold">{plotLabel(plot)}</span>
                  <span className="mt-0.5 block">
                    {Math.round(plot.areaSqm).toLocaleString('en-NG')} m²
                    {plot.isCorner ? ' · corner' : ''}
                  </span>
                  <span className="mt-1 block font-medium">{formatCurrency(plot.price)}</span>
                  <span className="mt-1 block text-[11px] uppercase tracking-wide">
                    {LAND_PLOT_STATUS_LABELS[plot.status]}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
};
