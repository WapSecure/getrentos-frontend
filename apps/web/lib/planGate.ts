import { ApiError } from '@/lib/apiHelpers';

/** Machine-readable reasons the backend attaches to a 403 when a route/limit is Pro-gated. */
export const PLAN_GATE_REASONS = ['PLAN_UPGRADE_REQUIRED', 'PLAN_LIMIT_REACHED'] as const;
export type PlanGateReason = (typeof PLAN_GATE_REASONS)[number];

/** True when `err` is the ApiError thrown by unwrap() for a Pro-gated route or a Free-tier cap. */
export function isPlanGateError(err: unknown): err is ApiError & { code: PlanGateReason } {
  return (
    err instanceof ApiError && (PLAN_GATE_REASONS as readonly string[]).includes(err.code ?? '')
  );
}
