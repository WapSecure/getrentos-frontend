import { useCallback } from 'react';
import * as WebBrowser from 'expo-web-browser';
import { useToast } from '@getrentos/ui-native';
import { paymentStatusApi, type PaymentState } from '@/lib/api/paymentStatus';
import { formatNaira } from '@/lib/format';

/** How often, and for how long, to ask after the payer comes back from Paystack. */
const POLL_MS = 2_500;
const WAIT_MS = 30_000;

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Opens a Paystack checkout in the in-app browser and, once the payer closes
 * it, waits for GetRentos to confirm the payment, then says how it went.
 *
 * Before, each screen refetched once on close: a webhook a few seconds late
 * left the payment on "Processing" until a manual refresh. The status endpoint
 * also asks Paystack itself while the payment is pending, so a slow webhook
 * no longer decides how long the payer waits.
 *
 * Returns the last known state, or null when there was no reference to ask
 * about (the screen's own refetch still runs).
 */
export function usePaystackCheckout() {
  const toast = useToast();

  return useCallback(
    async (authorizationUrl: string, reference?: string | null): Promise<PaymentState | null> => {
      await WebBrowser.openBrowserAsync(authorizationUrl);
      if (!reference) return null;

      const until = Date.now() + WAIT_MS;
      for (;;) {
        try {
          const status = await paymentStatusApi.get(reference);
          if (status.status === 'PAID') {
            toast.show(
              `${formatNaira(status.amount)} paid. Reference ${status.reference}.`,
              'success'
            );
            return 'PAID';
          }
          if (status.status === 'FAILED') {
            toast.show(
              'That payment didn’t go through. Nothing was taken for this attempt.',
              'error'
            );
            return 'FAILED';
          }
        } catch {
          // Not found yet or a network blip: keep asking until the time is up.
        }
        if (Date.now() >= until) break;
        await wait(POLL_MS);
      }
      toast.show(
        'Still confirming with your bank. If you were charged it will show as paid: you don’t need to pay again.',
        'info'
      );
      return 'PENDING';
    },
    [toast]
  );
}
