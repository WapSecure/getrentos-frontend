import { useCallback } from 'react';
import { router, useFocusEffect } from 'expo-router';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { qk } from '@/lib/query/keys';
import { agentMessagesApi } from '@/lib/api/agentMessages';
import { Inbox } from '@/components/messages/Inbox';

export default function AgentMessages() {
  const qc = useQueryClient();
  const query = useQuery({
    queryKey: qk.agent.conversations,
    queryFn: () => agentMessagesApi.list(1, 30),
  });

  // Coming back from a thread: the last message may have changed.
  useFocusEffect(
    useCallback(() => {
      qc.invalidateQueries({ queryKey: qk.agent.conversations });
    }, [qc])
  );

  return (
    <Inbox
      subtitle="Clients and property teams"
      conversations={query.data?.items.map((c) => ({
        id: c.id,
        participantName: c.client.legalName,
        lastMessage: c.lastMessage ?? undefined,
        lastMessageTime: c.lastMessageAt ?? c.createdAt,
        // The agent API doesn't count unread messages.
        unreadCount: 0,
      }))}
      loading={query.isPending}
      error={query.isError}
      refreshing={query.isRefetching}
      onRefresh={() => query.refetch()}
      onOpen={(c) => router.push(`/(app)/agent-conversation/${c.id}`)}
      emptyDescription="Conversations with your clients will appear here."
    />
  );
}
