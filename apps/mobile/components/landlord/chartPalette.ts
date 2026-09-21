/**
 * Categorical series colours for landlord charts.
 *
 * Validated with the dataviz palette checker against both chart surfaces
 * (light card #ffffff, dark card #14171e): lightness band, chroma floor,
 * CVD separation, normal-vision floor and contrast all pass. Worst adjacent
 * pair is ΔE 30.0 under protanopia, well clear of the ΔE 8 target.
 *
 * Income keys to the brand primary so the chart reads as part of the app;
 * expenses take the warm step, which is the CVD-safe counterpart to blue.
 * These are deliberately NOT the success/destructive tokens — status colours
 * are reserved for state and must not double as series identity.
 */
export const SERIES = {
  income: { light: '#0071e3', dark: '#2f8cff' },
  /** Passes in both modes, so it needs no per-mode step. */
  expenses: { light: '#d97706', dark: '#d97706' },
} as const;

export type SeriesKey = keyof typeof SERIES;

export function seriesColor(key: SeriesKey, scheme: 'light' | 'dark'): string {
  return SERIES[key][scheme];
}
