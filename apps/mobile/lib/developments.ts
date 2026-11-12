import {
  developmentSummaryOf,
  type ShowroomDevelopment,
  type ShowroomDevelopmentSummary,
} from '@sureground/shared/showroom';

/**
 * Pure helpers for the public developments screens. The model, wording and checks come from the
 * shared `developments.ts`, so the app says exactly what the web page says.
 */

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

/** "12 Nov 2026", as the web page dates approvals and progress photos. */
export const shortDay = (iso: string) =>
  new Date(iso).toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric' });

/** "12 November 2026", as the web page dates the staff checks. */
export const longDay = (iso: string) =>
  new Date(iso).toLocaleDateString('en-NG', { day: 'numeric', month: 'long', year: 'numeric' });

/** "Checked by Sureground on 12 Nov 2026. The documents stay private." */
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

/** The lowest stated "from" price across unit types, or undefined when none is stated. */
export function lowestUnitPrice(d: Pick<ShowroomDevelopment, 'unitTypes'>): number | undefined {
  const prices = d.unitTypes
    .map((u) => u.priceFromNaira)
    .filter((n): n is number => typeof n === 'number');
  return prices.length ? Math.min(...prices) : undefined;
}

/** What an instalment applies to and when, as stated: "On signing · 3-bed terrace". */
export function instalmentContext(
  i: { dueWhen?: string; unitTypeId?: string },
  unitTypes: { id: string; name: string }[]
): string {
  const unit = i.unitTypeId ? unitTypes.find((u) => u.id === i.unitTypeId)?.name : 'All unit types';
  return [i.dueWhen, unit].filter(Boolean).join(' · ');
}

/** `tel:` link for the developer's stated sales number, spaces removed. */
export const telLink = (phone: string) => `tel:${phone.replace(/\s/g, '')}`;
export const mailLink = (email: string) => `mailto:${email}`;
