import { useCallback } from 'react';
import { router, useFocusEffect } from 'expo-router';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { qk } from '@/lib/query/keys';
import { buyerMessagesApi } from '@/lib/api/buyerMessages';
import { roleLabel } from '@/lib/format';
import { Inbox } from '@/components/messages/Inbox';

export default function BuyerMessages() {
  const qc = useQueryClient();
  const query = useQuery({
    queryKey: qk.buyer.conversations,
    queryFn: () => buyerMessagesApi.list(1, 30),
  });

  // Coming back from a thread: unread counts and pins may have changed.
  useFocusEffect(
    useCallback(() => {
      qc.invalidateQueries({ queryKey: qk.buyer.conversations });
    }, [qc])
  );

  return (
    <Inbox
      subtitle="Sellers, realtors and agents"
      conversations={query.data?.items.map((c) => ({
        ...c,
        context: c.propertyName ?? roleLabel(c.participantRole),
      }))}
      loading={query.isPending}
      error={query.isError}
      refreshing={query.isRefetching}
      onRefresh={() => query.refetch()}
      onOpen={(c) => router.push(`/(app)/buyer-conversation/${c.id}`)}
      emptyDescription="Message a seller or agent from a listing to start a conversation."
    />
  );
}
