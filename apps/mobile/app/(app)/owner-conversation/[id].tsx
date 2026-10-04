import { useLocalSearchParams } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { qk } from '@/lib/query/keys';
import { ownerApi } from '@/lib/api/owner';
import { useAuth } from '@/lib/auth/AuthProvider';
import { MessageThread } from '@/components/messages/MessageThread';

export default function OwnerConversation() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { profile } = useAuth();
  const conversations = useQuery({
    queryKey: qk.owner.conversations,
    queryFn: () => ownerApi.conversations(1, 50),
  });
  const conversation = conversations.data?.items.find((c) => c.id === id);

  return (
    <MessageThread
      id={id}
      name={conversation?.participantName}
      context={conversation?.propertyName}
      messagesKey={qk.owner.messages(id)}
      fetchMessages={async () =>
        (await ownerApi.messages(id)).map((m) => ({
          id: m.id,
          text: m.text,
          timestamp: m.timestamp,
          mine: m.senderId === profile?.id,
          senderName: m.senderName,
        }))
      }
      send={(text) => ownerApi.send(id, text)}
      markRead={() => ownerApi.markRead(id)}
      conversationsKey={qk.owner.conversations}
      emptyDescription="Send a message about this property or offer."
    />
  );
}
