import { useMutation, useQueryClient } from '@tanstack/react-query';
import { router } from 'expo-router';
import { useToast } from '@getrentos/ui-native';
import { buyerMessagesApi } from '@/lib/api/buyerMessages';
import { ApiError } from '@/lib/api/client';
import { qk } from '@/lib/query/keys';

/**
 * "Ask a question" on a for-sale listing: opens the buyer's thread with the
 * seller about it (the same one each time) and goes straight into it.
 */
export function useAskSeller() {
  const qc = useQueryClient();
  const toast = useToast();
  return useMutation({
    mutationFn: (listingId: string) => buyerMessagesApi.startAboutListing(listingId),
    onSuccess: (conversation) => {
      qc.invalidateQueries({ queryKey: qk.buyer.conversations });
      router.push(`/(app)/buyer-conversation/${conversation.id}`);
    },
    onError: (err) =>
      toast.show(err instanceof ApiError ? err.message : 'Could not reach the seller.', 'error'),
  });
}
