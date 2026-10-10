import { ApiError, apiFetch } from './client';
import type { ManagedEstate } from './estateManager';
import type { Paginated } from './properties';

/**
 * Setting an estate up and running its gate staff.
 *
 * Creating the first estate is open to every plan. A second one under the same
 * account is Pro: the API refuses it with 403 `PLAN_LIMIT_REACHED`. Staff
 * (gatemen) are on every plan.
 */

/* ---------------------------------- types --------------------------------- */

/** A gateman posted to the estate. They sign in with their own GetRentos account. */
export interface StaffMember {
  userId: string;
  name: string;
  email: string;
  addedAt: string;
}

export interface NewEstate {
  name: string;
  address: string;
  city: string;
  state: string;
  /** 1 to 50; omit when unknown. */
  gateCount?: number;
}

/** What the setup form holds before it is checked: every field as typed. */
export interface EstateDraft {
  name: string;
  address: string;
  city: string;
  state: string;
  gateCount: string;
}

export type EstateDraftErrors = Partial<Record<keyof EstateDraft, string>>;

/* ---------------------------------- keys ---------------------------------- */

export const STAFF_PAGE_SIZE = 20;

export const staffSetupKeys = {
  /** Everything cached for the estate's staff list; invalidate this after a write. */
  staff: (estateId: string) => ['estate-manager', estateId, 'staff'] as const,
};

/* ----------------------------------- api ---------------------------------- */

export const estateStaffSetupApi = {
  createEstate: (body: NewEstate) =>
    apiFetch<Pick<ManagedEstate, 'id' | 'name'> & Partial<ManagedEstate>>('/estate', {
      method: 'POST',
      body,
    }),

  staff: (estateId: string, page = 1) =>
    apiFetch<Paginated<StaffMember>>(
      `/estate/${estateId}/staff?page=${page}&pageSize=${STAFF_PAGE_SIZE}`
    ),
  /** The person must already have a GetRentos account under this email. */
  addGateman: (estateId: string, email: string) =>
    apiFetch<StaffMember>(`/estate/${estateId}/staff/gateman`, {
      method: 'POST',
      body: { email },
    }),
  removeGateman: (estateId: string, userId: string) =>
    apiFetch<void>(`/estate/${estateId}/staff/${userId}`, { method: 'DELETE' }),
};

/* --------------------------------- helpers -------------------------------- */

export const MAX_GATES = 50;

export const isEmail = (value: string) => /^\S+@\S+\.\S+$/.test(value.trim());

/** How an email goes to the API: trimmed and lower-cased, as accounts are stored. */
export const normaliseEmail = (value: string) => value.trim().toLowerCase();

/**
 * The plan said no: a Free account at its estate limit (403 `PLAN_LIMIT_REACHED`)
 * or a Pro-only action (402 `PLAN_UPGRADE_REQUIRED`).
 */
export const isPlanLimitError = (err: unknown) =>
  err instanceof ApiError &&
  (err.code === 'PLAN_LIMIT_REACHED' || err.code === 'PLAN_UPGRADE_REQUIRED' || err.status === 402);

/**
 * Checks the setup form the way the API will. Returns either the body to send
 * or what to fix, keyed by field.
 */
export function validateEstateDraft(
  draft: EstateDraft
): { ok: true; body: NewEstate } | { ok: false; errors: EstateDraftErrors } {
  const errors: EstateDraftErrors = {};
  const name = draft.name.trim();
  const address = draft.address.trim();
  const city = draft.city.trim();
  const state = draft.state.trim();
  const gatesText = draft.gateCount.trim();

  if (!name) errors.name = 'Give the estate a name.';
  if (!address) errors.address = 'Add the estate’s street address.';
  if (!city) errors.city = 'Add the city or town.';
  if (!state) errors.state = 'Choose the state.';

  let gateCount: number | undefined;
  if (gatesText) {
    const n = Number(gatesText);
    if (!/^\d+$/.test(gatesText) || n < 1 || n > MAX_GATES) {
      errors.gateCount = `Enter a number from 1 to ${MAX_GATES}.`;
    } else {
      gateCount = n;
    }
  }

  if (Object.keys(errors).length) return { ok: false, errors };
  return {
    ok: true,
    body: { name, address, city, state, ...(gateCount ? { gateCount } : {}) },
  };
}

/** "3 gatemen", "1 gateman", "No gatemen yet". */
export function staffCount(total: number): string {
  if (!total) return 'No gatemen yet';
  return `${total.toLocaleString('en-NG')} ${total === 1 ? 'gateman' : 'gatemen'}`;
}
