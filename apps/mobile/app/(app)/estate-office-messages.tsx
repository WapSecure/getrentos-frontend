import { useQuery } from '@tanstack/react-query';
import { qk } from '@/lib/query/keys';
import { residentApi } from '@/lib/api/resident';
import { residentOfficeApi } from '@/lib/api/estateOfficeMessages';
import { MessageThread } from '@/components/messages/MessageThread';

export default function EstateOfficeMessages() {
  const household = useQuery({
    queryKey: qk.resident.household,
    queryFn: () => residentApi.getMyHousehold(),
  });

  return (
    <MessageThread
      id="estate-office"
      name="Estate office"
      context={household.data?.estate.name}
      messagesKey={[...qk.resident.officeMessages, 'messages']}
      fetchMessages={async () =>
        (await residentOfficeApi.thread()).messages.map((m) => ({
          id: m.id,
          text: m.body,
          timestamp: m.createdAt,
          mine: !m.fromOffice,
          senderName: m.senderName,
        }))
      }
      send={(text) => residentOfficeApi.send(text)}
      conversationsKey={qk.resident.officeMessages}
      emptyDescription="Ask your estate office about dues, a violation, a visitor pass or anything else. Only the estate’s managers see these messages."
    />
  );
}
