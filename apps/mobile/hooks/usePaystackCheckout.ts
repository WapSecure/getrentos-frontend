import { useCallback } from 'react';
import * as WebBrowser from 'expo-web-browser';
import type { PaymentState } from '@/lib/api/paymentStatus';
import { confirmPayment } from '@/lib/paymentResult';

/**
 * Opens a Paystack or Monnify checkout in the in-app browser and, once the
 * payer closes it, waits for Sureground to confirm the payment (up to 60 s,
 * like web). How it went stays on screen in the payment result sheet, with
 * the amount, what it was for and the reference, until the payer closes it.
 *
 * The status endpoint also asks the payment company itself while the payment
 * is pending, so a slow webhook no longer decides how long the payer waits.
 *
 * Returns the last known state, or null when there was no reference to ask
 * about (the screen's own refetch still runs).
 */
export function usePaystackCheckout() {
  return useCallback(
    async (authorizationUrl: string, reference?: string | null): Promise<PaymentState | null> => {
      await WebBrowser.openBrowserAsync(authorizationUrl);
      if (!reference) return null;
      return confirmPayment(reference);
    },
    []
  );
}
