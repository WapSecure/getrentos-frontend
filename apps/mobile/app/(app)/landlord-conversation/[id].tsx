import { useLocalSearchParams } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { qk } from '@/lib/query/keys';
import { landlordApi } from '@/lib/api/landlord';
import { roleLabel } from '@/lib/format';
import { MessageThread } from '@/components/messages/MessageThread';

export default function LandlordConversation() {
  const { id, name } = useLocalSearchParams<{ id: string; name?: string }>();
  const conversations = useQuery({
    queryKey: qk.landlord.conversations,
    queryFn: () => landlordApi.conversations(1, 50),
  });
  const conversation = conversations.data?.items.find((c) => c.id === id);

  return (
    <MessageThread
      id={id}
      name={conversation?.participantName ?? name}
      context={conversation ? roleLabel(conversation.participantRole) : undefined}
      messagesKey={qk.landlord.conversationMessages(id)}
      fetchMessages={async () =>
        // The API returns newest first; a thread reads oldest first.
        [...(await landlordApi.conversationMessages(id)).items]
          .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
          .map((m) => ({
            id: m.id,
            text: m.text,
            timestamp: m.timestamp,
            mine: m.senderId === 'landlord',
          }))
      }
      send={(text) => landlordApi.sendMessage(id, text)}
      markRead={() => landlordApi.markConversationRead(id)}
      conversationsKey={qk.landlord.conversations}
      emptyDescription="Say hello: replies land here."
    />
  );
}
