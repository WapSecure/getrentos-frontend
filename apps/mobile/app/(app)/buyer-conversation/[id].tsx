import { Pressable } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Pin } from 'lucide-react-native';
import { useTheme } from '@getrentos/ui-native';
import { qk } from '@/lib/query/keys';
import { buyerMessagesApi } from '@/lib/api/buyerMessages';
import { roleLabel } from '@/lib/format';
import { useAuth } from '@/lib/auth/AuthProvider';
import { MessageThread } from '@/components/messages/MessageThread';

export default function BuyerConversationThread() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { profile } = useAuth();
  const { colors } = useTheme();
  const qc = useQueryClient();

  const conversations = useQuery({
    queryKey: qk.buyer.conversations,
    queryFn: () => buyerMessagesApi.list(1, 30),
  });
  const conversation = conversations.data?.items.find((c) => c.id === id);
  const pinned = !!conversation?.isPinned;

  const pin = useMutation({
    mutationFn: () => buyerMessagesApi.togglePinned(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.buyer.conversations }),
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
