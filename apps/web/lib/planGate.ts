import { PlanGateError, PLAN_GATE_REASONS, type PlanGateReason } from '@/lib/apiHelpers';

export { PLAN_GATE_REASONS };
export type { PlanGateReason };

export function isPlanGateError(err: unknown): err is PlanGateError {
  return err instanceof PlanGateError;
}
