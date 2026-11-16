import {
  developmentSummaryOf,
  type ShowroomDevelopment,
  type ShowroomDevelopmentSummary,
} from '@sureground/shared/showroom';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** The API only knows developments by UUID; anything else is not one, so it is never fetched. */
export const isDevelopmentId = (id: unknown): id is string =>
  typeof id === 'string' && UUID.test(id);

export interface DevelopmentsPage {
  items: ShowroomDevelopmentSummary[];
  total: number;
  page: number;
  totalPages: number;
}

/** A page from `GET /developments`, each item through the shared mapper; malformed ones are dropped. */
export function developmentsPageOf(raw: unknown): DevelopmentsPage {
  const r = (raw && typeof raw === 'object' ? raw : {}) as {
    items?: unknown;
    total?: unknown;
    page?: unknown;
    totalPages?: unknown;
  };
  const items = (Array.isArray(r.items) ? r.items : [])
    .map(developmentSummaryOf)
    .filter((d): d is ShowroomDevelopmentSummary => !!d);
  return {
    items,
    total: typeof r.total === 'number' ? r.total : items.length,
    page: typeof r.page === 'number' ? r.page : 1,
    totalPages: typeof r.totalPages === 'number' ? r.totalPages : 1,
  };
}

export const shortDay = (iso: string) =>
  new Date(iso).toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric' });

export const longDay = (iso: string) =>
  new Date(iso).toLocaleDateString('en-NG', { day: 'numeric', month: 'long', year: 'numeric' });

export const approvalCheckedLine = (checkedAt?: string) =>
  `Checked by Sureground${checkedAt ? ` on ${shortDay(checkedAt)}` : ''}. The documents stay private.`;

/** "By Palm Developers (registered as Palm Developers Ltd)", the second name only when it differs. */
export function developerLine(d: Pick<ShowroomDevelopment, 'developerName' | 'registeredName'>) {
  const registered =
    d.registeredName && d.registeredName.toLowerCase() !== d.developerName.toLowerCase()
      ? ` (registered as ${d.registeredName})`
      : '';
  return `By ${d.developerName}${registered}`;
}

export function lowestUnitPrice(d: Pick<ShowroomDevelopment, 'unitTypes'>): number | undefined {
  const prices = d.unitTypes
    .map((u) => u.priceFromNaira)
    .filter((n): n is number => typeof n === 'number');
  return prices.length ? Math.min(...prices) : undefined;
}

export function instalmentContext(
  i: { dueWhen?: string; unitTypeId?: string },
  unitTypes: { id: string; name: string }[]
): string {
  const unit = i.unitTypeId ? unitTypes.find((u) => u.id === i.unitTypeId)?.name : 'All unit types';
  return [i.dueWhen, unit].filter(Boolean).join(' · ');
}

export const telLink = (phone: string) => `tel:${phone.replace(/\s/g, '')}`;
export const mailLink = (email: string) => `mailto:${email}`;
