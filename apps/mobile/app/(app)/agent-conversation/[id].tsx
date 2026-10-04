import { useLocalSearchParams } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { qk } from '@/lib/query/keys';
import { agentMessagesApi } from '@/lib/api/agentMessages';
import { pickDocument } from '@/lib/filePicker';
import { useAuth } from '@/lib/auth/AuthProvider';
import { MessageThread } from '@/components/messages/MessageThread';

export default function AgentConversationThread() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { profile } = useAuth();
  const conversations = useQuery({
    queryKey: qk.agent.conversations,
    queryFn: () => agentMessagesApi.list(1, 30),
  });
  const conversation = conversations.data?.items.find((c) => c.id === id);

  return (
    <MessageThread
      id={id}
      name={conversation?.client.legalName}
      context="Client"
      messagesKey={qk.agent.messages(id)}
      fetchMessages={async () =>
        (await agentMessagesApi.messages(id)).map((m) => ({
          id: m.id,
          text: m.text,
          timestamp: m.createdAt,
          mine: m.senderId === profile?.id,
          senderName: m.sender.legalName,
          attachments: m.attachments,
        }))
      }
      send={(text, file) => agentMessagesApi.send(id, text, file)}
      conversationsKey={qk.agent.conversations}
      emptyDescription="Send an update, a question or a document."
      pickAttachment={pickDocument}
    />
  );
}
