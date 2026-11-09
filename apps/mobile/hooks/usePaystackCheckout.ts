import { useCallback } from 'react';
import * as WebBrowser from 'expo-web-browser';
import type { PaymentState } from '@/lib/api/paymentStatus';
import { confirmPayment } from '@/lib/paymentResult';

/** Waits up to 60 s (like web) for Sureground to confirm. Returns null when there was no reference to ask about. */
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
