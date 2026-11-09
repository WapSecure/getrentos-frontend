// Validated with the dataviz palette checker on both chart surfaces. Deliberately not the success/destructive tokens: status colours are reserved for state.
export const SERIES = {
  income: { light: '#0057d9', dark: '#7aa9ff' },
  expenses: { light: '#d97706', dark: '#d97706' },
} as const;

export type SeriesKey = keyof typeof SERIES;

export function seriesColor(key: SeriesKey, scheme: 'light' | 'dark'): string {
  return SERIES[key][scheme];
}
