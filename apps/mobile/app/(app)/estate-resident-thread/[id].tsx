import { useLocalSearchParams } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { qk } from '@/lib/query/keys';
import { useEstate } from '@/hooks/useEstate';
import { estateOfficeApi } from '@/lib/api/estateOfficeMessages';
import { MessageThread } from '@/components/messages/MessageThread';

export default function EstateResidentThread() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { estateId } = useEstate();
  const threads = useQuery({
    queryKey: qk.estateManager.residentThreads(estateId),
    queryFn: () => estateOfficeApi.threads(estateId),
    enabled: !!estateId,
  });
  const thread = threads.data?.find((t) => t.id === id);

  return (
    <MessageThread
      id={estateId ? id : ''}
      name={thread?.residentName ?? thread?.unitLabel}
      context={thread?.residentName ? thread.unitLabel : undefined}
      messagesKey={qk.estateManager.residentThread(estateId, id)}
      fetchMessages={async () =>
        (await estateOfficeApi.thread(estateId, id)).messages.map((m) => ({
          id: m.id,
          text: m.body,
          timestamp: m.createdAt,
          mine: m.fromOffice,
          senderName: m.senderName,
        }))
      }
      send={(text) => estateOfficeApi.reply(estateId, id, text)}
      conversationsKey={qk.estateManager.residentThreads(estateId)}
      emptyDescription="No messages from this household yet."
    />
  );
}
