/**
 * Showroom M8d follow-up: "Ask the developer". A signed-in buyer's question about a live development is
 * recorded, and the developer's firm answers it. Sureground is not a party to the sale and takes no
 * payment for a development. Everything from the API is read through the mappers below, which drop
 * anything malformed.
 */

export type DevelopmentEnquiryStatus = 'NEW' | 'ANSWERED' | 'CLOSED';

export const DEVELOPMENT_ENQUIRY_STATUSES: readonly DevelopmentEnquiryStatus[] = [
  'NEW',
  'ANSWERED',
  'CLOSED',
];

/** Kept in step with the backend's limits, so the form refuses what the API would. */
export const DEVELOPMENT_ENQUIRY_LIMITS = {
  messageMin: 10,
  messageMax: 2000,
  answerMin: 2,
  answerMax: 4000,
  openPerDevelopment: 3,
} as const;

export const DEVELOPMENT_ENQUIRY_STATUS_LABEL: Record<
  DevelopmentEnquiryStatus,
  { buyer: string; developer: string }
> = {
  NEW: { buyer: 'Waiting for an answer', developer: 'New' },
  ANSWERED: { buyer: 'Answered', developer: 'Answered' },
  CLOSED: { buyer: 'Closed', developer: 'Closed' },
};

export const DEVELOPMENT_ENQUIRY_COPY = {
  title: 'Ask the developer',
  lead: 'Send the developer a question through Sureground. We keep a record of it and their answer, so a question that goes unanswered can be followed up.',
  payment:
    "Sureground does not take payment for developments. Never send money because of a message; pay only into the developer's company account after you have a written contract.",
  signedOut: 'Sign in to ask the developer',
  sent: 'Your question was sent. We will let you know when the developer answers.',
  yours: 'Your questions',
  developerInbox: 'Questions from buyers',
  developerLead:
    'Buyers ask these through the public page. Answer here: the buyer is told in the app and by email. Sureground does not take payment for developments, so never ask a buyer to pay through a reply.',
} as const;

export interface DevelopmentEnquiryDevelopment {
  id: string;
  name: string;
  city: string;
  state: string;
  developerName: string;
  live: boolean;
}

/** A buyer's own question. */
export interface BuyerDevelopmentEnquiry {
  id: string;
  development: DevelopmentEnquiryDevelopment;
  unitTypeName?: string;
  message: string;
  status: DevelopmentEnquiryStatus;
  answer?: string;
  answeredAt?: string;
  closedAt?: string;
  createdAt: string;
}

/** A question in the developer's inbox: the buyer's name only, never their contact details. */
export interface DeveloperDevelopmentEnquiry {
  id: string;
  developmentId: string;
  buyerName: string;
  unitTypeName?: string;
  message: string;
  status: DevelopmentEnquiryStatus;
  answer?: string;
  answeredByName?: string;
  answeredAt?: string;
  closedAt?: string;
  createdAt: string;
}

export interface DevelopmentEnquiryCount {
  developmentId: string;
  newCount: number;
}

const isRecord = (v: unknown): v is Record<string, unknown> =>
  typeof v === 'object' && v !== null && !Array.isArray(v);
const text = (v: unknown, max: number) =>
  typeof v === 'string' && v.trim() ? v.trim().slice(0, max) : undefined;
const isoDate = (v: unknown) =>
  typeof v === 'string' && !Number.isNaN(Date.parse(v)) ? v : undefined;
const statusOf = (v: unknown) =>
  DEVELOPMENT_ENQUIRY_STATUSES.includes(v as DevelopmentEnquiryStatus)
    ? (v as DevelopmentEnquiryStatus)
    : undefined;

interface Common {
  id: string;
  unitTypeName?: string;
  message: string;
  status: DevelopmentEnquiryStatus;
  answer?: string;
  answeredAt?: string;
  closedAt?: string;
  createdAt: string;
}

function commonOf(raw: Record<string, unknown>): Common | undefined {
  const id = text(raw.id, 80);
  const message = text(raw.message, DEVELOPMENT_ENQUIRY_LIMITS.messageMax);
  const status = statusOf(raw.status);
  const createdAt = isoDate(raw.createdAt);
  if (!id || !message || !status || !createdAt) return undefined;
  const answer = text(raw.answer, DEVELOPMENT_ENQUIRY_LIMITS.answerMax);
  // "Answered" with no answer would promise the buyer something that is not there.
  if (status === 'ANSWERED' && !answer) return undefined;
  const unitTypeName = text(raw.unitTypeName, 200);
  const answeredAt = answer ? isoDate(raw.answeredAt) : undefined;
  const closedAt = status === 'CLOSED' ? isoDate(raw.closedAt) : undefined;
  return {
    id,
    ...(unitTypeName ? { unitTypeName } : {}),
    message,
    status,
    ...(answer ? { answer } : {}),
    ...(answeredAt ? { answeredAt } : {}),
    ...(closedAt ? { closedAt } : {}),
    createdAt,
  };
}

export function buyerDevelopmentEnquiryOf(raw: unknown): BuyerDevelopmentEnquiry | undefined {
  if (!isRecord(raw) || !isRecord(raw.development)) return undefined;
  const common = commonOf(raw);
  const d = raw.development;
  const id = text(d.id, 80);
  const name = text(d.name, 200);
  const city = text(d.city, 200);
  const state = text(d.state, 200);
  const developerName = text(d.developerName, 200);
  if (!common || !id || !name || !city || !state || !developerName) return undefined;
  return {
    ...common,
    development: { id, name, city, state, developerName, live: d.live === true },
  };
}

export function developerDevelopmentEnquiryOf(
  raw: unknown
): DeveloperDevelopmentEnquiry | undefined {
  if (!isRecord(raw)) return undefined;
  const common = commonOf(raw);
  const developmentId = text(raw.developmentId, 80);
  if (!common || !developmentId) return undefined;
  const answeredByName = common.answer ? text(raw.answeredByName, 200) : undefined;
  return {
    ...common,
    developmentId,
    buyerName: text(raw.buyerName, 200) ?? 'A buyer',
    ...(answeredByName ? { answeredByName } : {}),
  };
}

export function developmentEnquiryCountsOf(raw: unknown): Record<string, number> {
  const out: Record<string, number> = {};
  if (!Array.isArray(raw)) return out;
  for (const item of raw) {
    if (!isRecord(item)) continue;
    const id = text(item.developmentId, 80);
    const n = item.newCount;
    if (id && typeof n === 'number' && Number.isInteger(n) && n > 0) out[id] = n;
  }
  return out;
}

const listOf = <T>(raw: unknown, map: (r: unknown) => T | undefined): T[] =>
  Array.isArray(raw) ? raw.map(map).filter((x): x is T => x !== undefined) : [];

export const buyerDevelopmentEnquiriesOf = (raw: unknown) => listOf(raw, buyerDevelopmentEnquiryOf);
export const developerDevelopmentEnquiriesOf = (raw: unknown) =>
  listOf(raw, developerDevelopmentEnquiryOf);

/** Why the form cannot be sent yet, or undefined when it can. */
export function enquiryMessageProblem(message: string): string | undefined {
  const n = message.trim().length;
  if (n < DEVELOPMENT_ENQUIRY_LIMITS.messageMin)
    return `Write at least ${DEVELOPMENT_ENQUIRY_LIMITS.messageMin} characters.`;
  if (n > DEVELOPMENT_ENQUIRY_LIMITS.messageMax)
    return `Keep it under ${DEVELOPMENT_ENQUIRY_LIMITS.messageMax} characters.`;
  return undefined;
}

/** True while the buyer may ask this development another question. */
export function canAskAgain(enquiries: Pick<BuyerDevelopmentEnquiry, 'status'>[]): boolean {
  return (
    enquiries.filter((e) => e.status === 'NEW').length <
    DEVELOPMENT_ENQUIRY_LIMITS.openPerDevelopment
  );
}
