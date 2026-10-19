import { Pressable } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { Pin } from 'lucide-react-native';
import { useTheme } from '@getrentos/ui-native';
import { qk } from '@/lib/query/keys';
import { buyerMessagesApi, type BuyerConversation } from '@/lib/api/buyerMessages';
import type { Paginated } from '@/lib/api/buyer';
import { useOptimisticMutation } from '@/lib/query/optimistic';
import { roleLabel } from '@/lib/format';
import { useAuth } from '@/lib/auth/AuthProvider';
import { MessageThread } from '@/components/messages/MessageThread';

export default function BuyerConversationThread() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { profile } = useAuth();
  const { colors } = useTheme();

  const conversations = useQuery({
    queryKey: qk.buyer.conversations,
    queryFn: () => buyerMessagesApi.list(1, 30),
  });
  const conversation = conversations.data?.items.find((c) => c.id === id);
  const pinned = !!conversation?.isPinned;

  // The pin flips at once and goes back if the server refuses.
  const pin = useOptimisticMutation({
    mutationFn: () => buyerMessagesApi.togglePinned(id),
    patches: () => [
      {
        queryKey: qk.buyer.conversations,
        update: (old) => {
          const page = old as Paginated<BuyerConversation>;
          return {
            ...page,
            items: page.items.map((c) => (c.id === id ? { ...c, isPinned: !c.isPinned } : c)),
          };
        },
      },
    ],
    errorMessage: 'Could not update the pin. Please try again.',
  });

  return (
    <MessageThread
      id={id}
      name={conversation?.participantName}
      context={conversation?.propertyName ?? roleLabel(conversation?.participantRole)}
      messagesKey={qk.buyer.messages(id)}
      fetchMessages={async () =>
        (await buyerMessagesApi.messages(id)).map((m) => ({
          id: m.id,
          text: m.text,
          timestamp: m.timestamp,
          mine: m.senderId === profile?.id,
          senderName: m.senderName,
        }))
      }
      send={(text) => buyerMessagesApi.send(id, text)}
      markRead={() => buyerMessagesApi.markRead(id)}
      conversationsKey={qk.buyer.conversations}
      emptyDescription="Ask about the property, the price or a viewing."
      headerAccessory={
        <Pressable
          onPress={() => pin.mutate()}
          accessibilityRole="button"
          accessibilityLabel={pinned ? 'Unpin this conversation' : 'Pin this conversation'}
          accessibilityState={{ selected: pinned }}
          hitSlop={12}
          style={{ minWidth: 44, minHeight: 44, alignItems: 'center', justifyContent: 'center' }}
        >
          <Pin
            size={19}
            color={pinned ? colors.primary : colors.mutedForeground}
            fill={pinned ? colors.primary : 'transparent'}
          />
        </Pressable>
      }
    />
  );
}
