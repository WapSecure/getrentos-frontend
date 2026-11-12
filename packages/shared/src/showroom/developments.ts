import type { MediaItem } from './types';

/**
 * Showroom M8d, first step: off-plan developments are listed only. Sureground takes and holds no money
 * for them; buyers pay the developer. A development is public only after staff passed four checks.
 * Everything here is read through `developmentOf` / `developmentSummaryOf`, which drop anything malformed.
 */

export type DevelopmentStage = 'PLANNED' | 'APPROVED' | 'UNDER_CONSTRUCTION' | 'COMPLETED';
export type DevelopmentCheckKind =
  | 'DEVELOPER_CAC'
  | 'DIRECTOR_IDENTITY'
  | 'SITE_TITLE'
  | 'BUILDING_APPROVAL';

export const DEVELOPMENT_STAGES: readonly DevelopmentStage[] = [
  'PLANNED',
  'APPROVED',
  'UNDER_CONSTRUCTION',
  'COMPLETED',
];

export const DEVELOPMENT_CHECK_KINDS: readonly DevelopmentCheckKind[] = [
  'DEVELOPER_CAC',
  'DIRECTOR_IDENTITY',
  'SITE_TITLE',
  'BUILDING_APPROVAL',
];

/** As the developer states it; the page says so. */
export const DEVELOPMENT_STAGE_LABEL: Record<DevelopmentStage, string> = {
  PLANNED: 'Planned',
  APPROVED: 'Approved, not started',
  UNDER_CONSTRUCTION: 'Under construction',
  COMPLETED: 'Completed',
};

/** What each staff check covered, in plain words. */
export const DEVELOPMENT_CHECK_COPY: Record<
  DevelopmentCheckKind,
  { label: string; detail: string }
> = {
  DEVELOPER_CAC: {
    label: "Developer's CAC registration",
    detail: 'The company is registered with the CAC and passed our business verification.',
  },
  DIRECTOR_IDENTITY: {
    label: "Directors' identities",
    detail: "We matched the directors to the CAC record and checked each director's ID.",
  },
  SITE_TITLE: {
    label: 'Title to the site',
    detail:
      "We checked the C of O or Governor's consent the same way as for a land listing: registry and survey searches, and the developer's right to build.",
  },
  BUILDING_APPROVAL: {
    label: 'Building plan approval',
    detail:
      'We confirmed the building permit with the planning authority (LASPPPA in Lagos) and that it covers this site.',
  },
};

/** Said on every development page, next to the checks, so nobody reads more into them. */
export const DEVELOPMENT_NOT_CHECKED: readonly string[] = [
  'The construction itself: its quality, its progress, or whether it will finish on time',
  'The prices, unit types and payment plan, which are as the developer states them',
  "The developer's finances, or whether they can deliver",
  'Any contract you sign with the developer',
];

export const DEVELOPMENT_PAYMENT_COPY = {
  title: 'How payment works',
  lead: 'You pay the developer directly. Sureground does not take, hold or pass on any money for this development.',
  points: [
    'The payment plan below is as the developer states it. Sureground has not checked or worked out any of the amounts.',
    'Ask the developer for a written contract of sale before you pay, and have a lawyer read it.',
    "Pay only into the developer's company account, never a personal one.",
  ],
} as const;

export interface ShowroomDevelopmentCheck {
  kind: DevelopmentCheckKind;
  label: string;
  detail: string;
  checkedAt: string;
}

export interface ShowroomDevelopmentApproval {
  kind: 'SITE_TITLE' | 'BUILDING_APPROVAL' | 'OTHER_APPROVAL';
  label: string;
  authority?: string;
  /** True only when a Sureground staff check of it passed. */
  checked: boolean;
  checkedAt?: string;
}

export interface ShowroomUnitType {
  id: string;
  name: string;
  bedrooms?: number;
  bathrooms?: number;
  sizeSqm?: number;
  priceFromNaira?: number;
  unitsTotal?: number;
  unitsAvailable?: number;
}

export interface ShowroomInstalment {
  id: string;
  label: string;
  unitTypeId?: string;
  amountNaira?: number;
  percent?: number;
  dueWhen?: string;
}

export interface ShowroomDevelopment {
  id: string;
  name: string;
  summary?: string;
  addressLine: string;
  city: string;
  state: string;
  lga?: string;
  latitude?: number;
  longitude?: number;
  stage: DevelopmentStage;
  /** `YYYY-MM`, as the developer states it. */
  expectedCompletion?: string;
  developerName: string;
  registeredName?: string;
  /** Always all four: a development without them is not shown at all. */
  checks: ShowroomDevelopmentCheck[];
  approvals: ShowroomDevelopmentApproval[];
  /** Site photos are captioned with the date taken; impressions say they are impressions. */
  media: MediaItem[];
  /** Site photos only, newest first: the progress gallery. */
  progress: MediaItem[];
  unitTypes: ShowroomUnitType[];
  paymentNote?: string;
  instalments: ShowroomInstalment[];
  salesEmail?: string;
  salesPhone?: string;
  liveAt: string;
}

export interface ShowroomDevelopmentSummary {
  id: string;
  name: string;
  city: string;
  state: string;
  stage: DevelopmentStage;
  expectedCompletion?: string;
  developerName: string;
  cover?: MediaItem;
  priceFromNaira?: number;
  unitTypeCount: number;
}

const NAME_MAX = 200;
const TEXT_MAX = 2000;
const MAX_ITEMS = 60;

const isRecord = (v: unknown): v is Record<string, unknown> =>
  typeof v === 'object' && v !== null && !Array.isArray(v);
const text = (v: unknown, max = NAME_MAX) =>
  typeof v === 'string' && v.trim() ? v.trim().slice(0, max) : undefined;
const count = (v: unknown, max = 100_000) =>
  typeof v === 'number' && Number.isInteger(v) && v >= 0 && v <= max ? v : undefined;
const positive = (v: unknown, max: number) =>
  typeof v === 'number' && Number.isFinite(v) && v > 0 && v <= max ? v : undefined;
const isoDate = (v: unknown) =>
  typeof v === 'string' && !Number.isNaN(Date.parse(v)) ? v : undefined;
const month = (v: unknown) =>
  typeof v === 'string' && /^\d{4}-(0[1-9]|1[0-2])$/.test(v) ? v : undefined;
const stageOf = (v: unknown) =>
  DEVELOPMENT_STAGES.includes(v as DevelopmentStage) ? (v as DevelopmentStage) : undefined;
const httpsUrl = (v: unknown) => (typeof v === 'string' && /^https?:\/\//i.test(v) ? v : undefined);

/** "June 2027" from "2027-06". */
export function completionLabel(value: string | undefined): string | undefined {
  if (!value || !month(value)) return undefined;
  const [y, m] = value.split('-').map(Number) as [number, number];
  return new Date(Date.UTC(y, m - 1, 1)).toLocaleDateString('en-NG', {
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  });
}

const takenLabel = (iso: string) =>
  `Taken ${new Date(iso).toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' })}`;

/**
 * One photo from the API. A site photo without a capture date is dropped (the gallery is dated); an
 * impression is captioned as one whatever the developer wrote.
 */
function mediaItemOf(raw: unknown, order: number): MediaItem | undefined {
  if (!isRecord(raw) || raw.kind !== 'image') return undefined;
  const id = text(raw.id, 80);
  const url = httpsUrl(raw.url);
  if (!id || !url) return undefined;
  const caption = text(raw.caption, 140);
  const isRender = raw.source === 'render';
  const capturedAt = isoDate(raw.capturedAt);
  if (!isRender && !capturedAt) return undefined;
  const label = isRender ? "Artist's impression" : takenLabel(capturedAt!);
  const variants = Array.isArray(raw.variants)
    ? raw.variants
        .filter(
          (v): v is { width: number; url: string } =>
            isRecord(v) && typeof v.width === 'number' && !!httpsUrl(v.url)
        )
        .map((v) => ({ width: v.width, url: v.url }))
    : undefined;
  return {
    id,
    kind: 'image',
    url,
    ...(typeof raw.width === 'number' && typeof raw.height === 'number'
      ? { width: raw.width, height: raw.height }
      : {}),
    ...(typeof raw.placeholder === 'string' && raw.placeholder.startsWith('data:image/')
      ? { placeholder: raw.placeholder }
      : {}),
    ...(variants?.length ? { variants } : {}),
    caption: caption ? `${label} · ${caption}` : label,
    alt: caption ?? label,
    order,
    ...(isRender ? { source: 'render' as const } : { capturedAt }),
  };
}

function mediaOf(raw: unknown): MediaItem[] {
  if (!Array.isArray(raw)) return [];
  const out: MediaItem[] = [];
  for (const item of raw.slice(0, MAX_ITEMS)) {
    const m = mediaItemOf(item, out.length);
    if (m) out.push(m);
  }
  return out;
}

function unitTypesOf(raw: unknown): ShowroomUnitType[] {
  if (!Array.isArray(raw)) return [];
  const out: ShowroomUnitType[] = [];
  for (const u of raw.slice(0, MAX_ITEMS)) {
    if (!isRecord(u)) continue;
    const id = text(u.id, 80);
    const name = text(u.name);
    if (!id || !name) continue;
    const bedrooms = count(u.bedrooms, 20);
    const bathrooms = count(u.bathrooms, 20);
    const sizeSqm = positive(u.sizeSqm, 999_999);
    const priceFromNaira = positive(u.priceFromNaira, 1e12);
    const unitsTotal = count(u.unitsTotal);
    let unitsAvailable = count(u.unitsAvailable);
    // A count above the total is not shown rather than guessed at.
    if (unitsAvailable !== undefined && unitsTotal !== undefined && unitsAvailable > unitsTotal)
      unitsAvailable = undefined;
    out.push({
      id,
      name,
      ...(bedrooms !== undefined ? { bedrooms } : {}),
      ...(bathrooms !== undefined ? { bathrooms } : {}),
      ...(sizeSqm !== undefined ? { sizeSqm } : {}),
      ...(priceFromNaira !== undefined ? { priceFromNaira } : {}),
      ...(unitsTotal !== undefined ? { unitsTotal } : {}),
      ...(unitsAvailable !== undefined ? { unitsAvailable } : {}),
    });
  }
  return out;
}

function instalmentsOf(raw: unknown, unitTypes: ShowroomUnitType[]): ShowroomInstalment[] {
  if (!Array.isArray(raw)) return [];
  const units = new Set(unitTypes.map((u) => u.id));
  const out: ShowroomInstalment[] = [];
  for (const i of raw.slice(0, MAX_ITEMS)) {
    if (!isRecord(i)) continue;
    const id = text(i.id, 80);
    const label = text(i.label);
    if (!id || !label) continue;
    const unitTypeId = typeof i.unitTypeId === 'string' ? i.unitTypeId : undefined;
    // A line for a unit type that is not on the page would be read as applying to all.
    if (unitTypeId && !units.has(unitTypeId)) continue;
    const amountNaira = positive(i.amountNaira, 1e12);
    const percent = positive(i.percent, 100);
    const dueWhen = text(i.dueWhen);
    out.push({
      id,
      label,
      ...(unitTypeId ? { unitTypeId } : {}),
      ...(amountNaira !== undefined ? { amountNaira } : {}),
      ...(percent !== undefined ? { percent } : {}),
      ...(dueWhen ? { dueWhen } : {}),
    });
  }
  return out;
}

/**
 * A public development, or undefined when it cannot be shown honestly: it must name all four checks with
 * a date, and its payment must go to the developer. Never anything else.
 */
export function developmentOf(raw: unknown): ShowroomDevelopment | undefined {
  if (!isRecord(raw)) return undefined;
  const id = text(raw.id, 80);
  const name = text(raw.name);
  const stage = stageOf(raw.stage);
  const location = isRecord(raw.location) ? raw.location : {};
  const addressLine = text(location.addressLine);
  const city = text(location.city);
  const state = text(location.state);
  const developer = isRecord(raw.developer) ? raw.developer : {};
  const developerName = text(developer.name);
  const liveAt = isoDate(raw.liveAt);
  const plan = isRecord(raw.paymentPlan) ? raw.paymentPlan : {};
  if (!id || !name || !stage || !addressLine || !city || !state || !developerName || !liveAt)
    return undefined;
  if (plan.paidTo !== 'DEVELOPER') return undefined;

  const rawChecks = Array.isArray(raw.checks) ? raw.checks : [];
  const checks: ShowroomDevelopmentCheck[] = [];
  for (const kind of DEVELOPMENT_CHECK_KINDS) {
    const found = rawChecks.find((c) => isRecord(c) && c.kind === kind) as
      | Record<string, unknown>
      | undefined;
    const checkedAt = isoDate(found?.checkedAt);
    if (!checkedAt) return undefined;
    checks.push({ kind, ...DEVELOPMENT_CHECK_COPY[kind], checkedAt });
  }

  const approvals: ShowroomDevelopmentApproval[] = [];
  for (const a of Array.isArray(raw.approvals) ? raw.approvals.slice(0, MAX_ITEMS) : []) {
    if (!isRecord(a)) continue;
    const kind = a.kind;
    const label = text(a.label);
    if (
      !label ||
      (kind !== 'SITE_TITLE' && kind !== 'BUILDING_APPROVAL' && kind !== 'OTHER_APPROVAL')
    )
      continue;
    // Other approvals are the developer's statement: never shown as checked, whatever is sent.
    const checked = kind !== 'OTHER_APPROVAL' && a.checked === true;
    const authority = text(a.authority);
    const checkedAt = checked ? isoDate(a.checkedAt) : undefined;
    approvals.push({
      kind,
      label,
      ...(authority ? { authority } : {}),
      checked,
      ...(checkedAt ? { checkedAt } : {}),
    });
  }

  const media = mediaOf(raw.media);
  const unitTypes = unitTypesOf(raw.unitTypes);
  const lat = typeof location.latitude === 'number' ? location.latitude : undefined;
  const lng = typeof location.longitude === 'number' ? location.longitude : undefined;
  const hasPoint =
    lat !== undefined &&
    lng !== undefined &&
    Math.abs(lat) <= 90 &&
    Math.abs(lng) <= 180 &&
    !(lat === 0 && lng === 0);
  const summary = text(raw.summary, TEXT_MAX);
  const lga = text(location.lga);
  const expectedCompletion = month(raw.expectedCompletion);
  const registeredName = text(developer.registeredName);
  const paymentNote = text(plan.note, TEXT_MAX);
  const salesEmail = text(raw.salesEmail);
  const salesPhone = text(raw.salesPhone, 20);

  return {
    id,
    name,
    ...(summary ? { summary } : {}),
    addressLine,
    city,
    state,
    ...(lga ? { lga } : {}),
    ...(hasPoint ? { latitude: lat, longitude: lng } : {}),
    stage,
    ...(expectedCompletion ? { expectedCompletion } : {}),
    developerName,
    ...(registeredName ? { registeredName } : {}),
    checks,
    approvals,
    media,
    progress: media
      .filter((m) => m.capturedAt && m.source !== 'render')
      .sort((a, b) => Date.parse(b.capturedAt!) - Date.parse(a.capturedAt!)),
    unitTypes,
    ...(paymentNote ? { paymentNote } : {}),
    instalments: instalmentsOf(plan.instalments, unitTypes),
    ...(salesEmail && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(salesEmail) ? { salesEmail } : {}),
    ...(salesPhone && /^[+\d][\d\s-]{6,19}$/.test(salesPhone) ? { salesPhone } : {}),
    liveAt,
  };
}

export function developmentSummaryOf(raw: unknown): ShowroomDevelopmentSummary | undefined {
  if (!isRecord(raw)) return undefined;
  const id = text(raw.id, 80);
  const name = text(raw.name);
  const city = text(raw.city);
  const state = text(raw.state);
  const stage = stageOf(raw.stage);
  const developerName = text(raw.developerName);
  if (!id || !name || !city || !state || !stage || !developerName) return undefined;
  const cover = mediaItemOf(raw.cover, 0);
  const priceFromNaira = positive(raw.priceFromNaira, 1e12);
  const expectedCompletion = month(raw.expectedCompletion);
  return {
    id,
    name,
    city,
    state,
    stage,
    ...(expectedCompletion ? { expectedCompletion } : {}),
    developerName,
    ...(cover ? { cover } : {}),
    ...(priceFromNaira !== undefined ? { priceFromNaira } : {}),
    unitTypeCount: count(raw.unitTypeCount) ?? 0,
  };
}

/**
 * One instalment's amount as stated: "₦50,000,000", "30% of the price", or the timing only. Never a
 * total, and a percentage is never turned into naira.
 */
export function instalmentAmountLabel(
  i: Pick<ShowroomInstalment, 'amountNaira' | 'percent'>,
  formatNaira: (n: number) => string
): string {
  if (i.amountNaira !== undefined && i.percent !== undefined)
    return `${formatNaira(i.amountNaira)} (${formatPercent(i.percent)} of the price)`;
  if (i.amountNaira !== undefined) return formatNaira(i.amountNaira);
  if (i.percent !== undefined) return `${formatPercent(i.percent)} of the price`;
  return 'Amount not stated';
}

const formatPercent = (n: number) => `${Number(n.toFixed(2))}%`;
