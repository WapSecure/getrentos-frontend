import { PlanGateError, PLAN_GATE_REASONS, type PlanGateReason } from '@/lib/apiHelpers';

export { PLAN_GATE_REASONS };
export type { PlanGateReason };

/** True when `err` is the PlanGateError thrown by unwrap() for a Pro-gated route or a Free-tier cap. */
export function isPlanGateError(err: unknown): err is PlanGateError {
  return err instanceof PlanGateError;
}
