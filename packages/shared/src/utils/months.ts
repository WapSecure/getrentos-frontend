/**
 * The last `count` calendar months as YYYY-MM options, newest first, in Lagos
 * time (UTC+1 all year) — the month a report means is the one people in Lagos
 * are living in, not the browser's.
 */
export function recentMonthOptions(count = 18): { value: string; label: string }[] {
  const now = new Date(Date.now() + 3_600_000);
  const out: { value: string; label: string }[] = [];
  for (let i = 0; i < count; i += 1) {
    const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - i, 1));
    out.push({
      value: `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`,
      label: d.toLocaleDateString('en-NG', { month: 'long', year: 'numeric', timeZone: 'UTC' }),
    });
  }
  return out;
}
