import { useMutation, useQueryClient } from '@tanstack/react-query';
import { router } from 'expo-router';
import { useToast } from '@sureground/ui-native';
import { buyerMessagesApi } from '@/lib/api/buyerMessages';
import { errorMessage } from '@/lib/api/client';
import { qk } from '@/lib/query/keys';

export function useAskSeller() {
  const qc = useQueryClient();
  const toast = useToast();
  return useMutation({
    mutationFn: (listingId: string) => buyerMessagesApi.startAboutListing(listingId),
    onSuccess: (conversation) => {
      qc.invalidateQueries({ queryKey: qk.buyer.conversations });
      router.push(`/(app)/buyer-conversation/${conversation.id}`);
    },
    onError: (err) => toast.show(errorMessage(err, 'Could not reach the seller.'), 'error'),
  });
}
