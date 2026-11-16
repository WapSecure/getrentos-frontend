interface CollectableDelivery {
  residentName?: string;
  collectedAt?: string;
  collectedBy?: string;
}

const MAX_COLLECTOR_NAME = 100;

const sameDay = (a: Date, b: Date) =>
  a.getFullYear() === b.getFullYear() &&
  a.getMonth() === b.getMonth() &&
  a.getDate() === b.getDate();

const formatTime = (value: Date) =>
  new Intl.DateTimeFormat('en-NG', { hour: 'numeric', minute: '2-digit' }).format(value);

const formatDay = (value: Date) =>
  new Intl.DateTimeFormat('en-NG', { day: 'numeric', month: 'short' }).format(value);

export const collectionSummary = (
  log: CollectableDelivery,
  now: Date = new Date()
): string | undefined => {
  if (!log.collectedAt) return undefined;
  const at = new Date(log.collectedAt);
  if (Number.isNaN(at.getTime())) return undefined;
  const who = log.collectedBy?.trim() ? ` by ${log.collectedBy.trim()}` : '';
  const when = sameDay(at, now)
    ? `at ${formatTime(at)}`
    : `on ${formatDay(at)} at ${formatTime(at)}`;
  return `Collected${who} ${when}`;
};

export const defaultCollectorName = (log: CollectableDelivery): string =>
  (log.residentName ?? '').trim().slice(0, MAX_COLLECTOR_NAME);

export const COLLECTOR_NAME_MAX_LENGTH = MAX_COLLECTOR_NAME;
