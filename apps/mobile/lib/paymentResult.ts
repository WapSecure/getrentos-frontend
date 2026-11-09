import { useSyncExternalStore } from 'react';
import { paymentStatusApi, type PaymentState, type PaymentStatus } from '@/lib/api/paymentStatus';

export interface PaymentResult {
  phase: 'CONFIRMING' | PaymentState;
  reference: string;
  payment: PaymentStatus | null;
}

// Same wait as web.
export const PAYMENT_POLL_MS = 2_500;
export const PAYMENT_WAIT_MS = 60_000;

let current: PaymentResult | null = null;
const listeners = new Set<() => void>();

function set(next: PaymentResult | null) {
  current = next;
  listeners.forEach((l) => l());
}

export function showPaymentResult(next: PaymentResult) {
  set(next);
}

export function closePaymentResult() {
  set(null);
}

export function usePaymentResult(): PaymentResult | null {
  return useSyncExternalStore(
    (l) => {
      listeners.add(l);
      return () => listeners.delete(l);
    },
    () => current,
    () => current
  );
}

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export async function confirmPayment(reference: string): Promise<PaymentState> {
  let payment: PaymentStatus | null = null;
  showPaymentResult({ phase: 'CONFIRMING', reference, payment });
  const until = Date.now() + PAYMENT_WAIT_MS;
  for (;;) {
    try {
      payment = await paymentStatusApi.get(reference);
      if (payment.status === 'PAID' || payment.status === 'FAILED') {
        showPaymentResult({ phase: payment.status, reference, payment });
        return payment.status;
      }
    } catch {
      // Not found yet or a network blip: keep asking until the time is up.
    }
    if (Date.now() >= until) break;
    await wait(PAYMENT_POLL_MS);
  }
  showPaymentResult({ phase: 'PENDING', reference, payment });
  return 'PENDING';
}
