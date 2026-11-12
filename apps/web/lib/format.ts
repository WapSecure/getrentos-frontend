export const formatCurrency = (amount: number, options?: { compact?: boolean }): string => {
  if (options?.compact) {
    if (Math.abs(amount) >= 1_000_000_000) {
      return `₦${Number((amount / 1_000_000_000).toFixed(1))}B`;
    }
    if (Math.abs(amount) >= 1_000_000) {
      return `₦${Number((amount / 1_000_000).toFixed(1))}M`;
    }
    if (Math.abs(amount) >= 1_000) {
      return `₦${(amount / 1_000).toFixed(0)}K`;
    }
  }
  return new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: 'NGN',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

export const formatDate = (
  dateString: string,
  style: 'short' | 'long' | 'full' = 'short'
): string => {
  const date = new Date(dateString);
  if (style === 'long') {
    return date.toLocaleDateString('en-GB', { month: 'long', day: 'numeric', year: 'numeric' });
  }
  if (style === 'full') {
    return date.toLocaleDateString('en-GB', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });
  }
  return date.toLocaleDateString('en-GB', { month: 'short', day: 'numeric', year: 'numeric' });
};

/** Payment dates are read in Lagos time, whatever zone the browser is in. */
export const APP_TIME_ZONE = 'Africa/Lagos';

export const formatLagosDate = (dateString: string, style: 'short' | 'long' = 'short'): string => {
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleDateString('en-GB', {
    month: style === 'long' ? 'long' : 'short',
    day: 'numeric',
    year: 'numeric',
    timeZone: APP_TIME_ZONE,
  });
};

// Moved to @sureground/shared so the mobile app shows the same Lagos and local times.
export { formatDualTime, isValidTimeZone, timeZoneCity } from '@sureground/shared';

export const formatRelativeTime = (dateString: string): string => {
  const date = new Date(dateString);
  const diffMs = Date.now() - date.getTime();
  const diffMinutes = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMinutes < 1) return 'Just now';
  if (diffMinutes < 60) return `${diffMinutes} min${diffMinutes === 1 ? '' : 's'} ago`;
  if (diffHours < 24) return `${diffHours} hour${diffHours === 1 ? '' : 's'} ago`;
  if (diffDays < 7) return `${diffDays} day${diffDays === 1 ? '' : 's'} ago`;
  return formatDate(dateString);
};

export const getInitials = (fullName: string): string => {
  const parts = fullName.trim().split(' ').filter(Boolean);
  const first = parts[0]?.[0] || '';
  const last = parts.length > 1 ? parts[parts.length - 1][0] : '';
  return `${first}${last}`.toUpperCase() || 'U';
};

export const pluralize = (
  count: number,
  singular: string,
  plural: string = `${singular}s`
): string => `${count} ${count === 1 ? singular : plural}`;

export const formatAskingDifference = (diffPct: number): string => {
  if (diffPct === 0) return 'At the asking price';
  const size = Math.abs(diffPct);
  return `${size.toFixed(Number.isInteger(size) ? 0 : 1)}% ${diffPct > 0 ? 'above' : 'below'} asking`;
};
