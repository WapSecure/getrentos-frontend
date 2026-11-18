import { PlanGateError, PLAN_GATE_REASONS, type PlanGateReason } from '@/lib/apiHelpers';

export { PLAN_GATE_REASONS };
export type { PlanGateReason };

export function isPlanGateError(err: unknown): err is PlanGateError {
  return err instanceof PlanGateError;
}

const BILLING_SECTIONS = ['landlord', 'estate', 'owner', 'realtor'] as const;

/** The section's own billing page; a section without one (agency, agent) goes to the public pricing page. */
export function billingHrefFor(pathname: string | null): string {
  const section = pathname?.split('/')[1];
  return BILLING_SECTIONS.some((s) => s === section) ? `/${section}/billing` : '/pricing';
}
