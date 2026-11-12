/** Structural, so web and mobile can pass their own delivery types. */
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

/**
 * "Collected by Ada Okoro at 2:05 pm", with the day added when it was not today.
 * Undefined for a parcel still at the gate.
 */
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

/** The name the confirm dialog starts with: the household resident, trimmed to what the API accepts. */
export const defaultCollectorName = (log: CollectableDelivery): string =>
  (log.residentName ?? '').trim().slice(0, MAX_COLLECTOR_NAME);

export const COLLECTOR_NAME_MAX_LENGTH = MAX_COLLECTOR_NAME;
