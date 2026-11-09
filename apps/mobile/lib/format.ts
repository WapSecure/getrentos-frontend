// Assumes major-unit Naira amounts, as the current renter endpoints return.

export function formatNaira(amount: number, opts: { compact?: boolean } = {}): string {
  if (opts.compact) {
    if (Math.abs(amount) >= 1_000_000) return `₦${Number((amount / 1_000_000).toFixed(1))}M`;
    if (Math.abs(amount) >= 1_000) return `₦${Math.round(amount / 1_000)}K`;
  }
  return new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: 'NGN',
    maximumFractionDigits: 0,
  }).format(amount);
}

// Lagos time whatever the phone's zone, so everyone sees the same time as the owner and the web app.
export const APP_TIME_ZONE = 'Africa/Lagos';

export function formatDate(value: string | Date, style: 'short' | 'medium' = 'medium'): string {
  const d = typeof value === 'string' ? new Date(value) : value;
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('en-GB', {
    month: style === 'short' ? 'short' : 'long',
    day: 'numeric',
    year: 'numeric',
    timeZone: APP_TIME_ZONE,
  });
}

export function formatTime(value: string | Date): string {
  const d = typeof value === 'string' ? new Date(value) : value;
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    timeZone: APP_TIME_ZONE,
  });
}

// For anything that lapses within a day, the date alone misleads.
export function formatDateTime(value: string | Date, style: 'short' | 'medium' = 'short'): string {
  const d = typeof value === 'string' ? new Date(value) : value;
  if (Number.isNaN(d.getTime())) return '—';
  return `${formatDate(d, style)}, ${formatTime(d)}`;
}

export function relativeTime(value: string | Date): string {
  const d = typeof value === 'string' ? new Date(value) : value;
  const diff = Date.now() - d.getTime();
  const mins = Math.round(diff / 60_000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.round(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.round(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return formatDate(d, 'short');
}

export const firstName = (full?: string | null) => full?.trim().split(/\s+/)[0] ?? 'there';

export function roleLabel(role?: string | null): string | undefined {
  if (!role) return undefined;
  const words = role.replace(/_/g, ' ').trim().toLowerCase();
  return words ? words[0].toUpperCase() + words.slice(1) : undefined;
}
