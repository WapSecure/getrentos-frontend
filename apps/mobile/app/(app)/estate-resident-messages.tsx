import { router } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { qk } from '@/lib/query/keys';
import { useEstate } from '@/hooks/useEstate';
import { estateOfficeApi } from '@/lib/api/estateOfficeMessages';
import { Inbox } from '@/components/messages/Inbox';
import { goBack } from '@/lib/goBack';

export default function EstateResidentMessages() {
  const { estateId } = useEstate();
  const query = useQuery({
    queryKey: qk.estateManager.residentThreads(estateId),
    queryFn: () => estateOfficeApi.threads(estateId),
    enabled: !!estateId,
  });

  return (
    <Inbox
      title="Resident messages"
      subtitle="Households writing to the estate office"
      onBack={() => goBack()}
      searchPlaceholder="Search units, residents or messages"
      conversations={query.data?.map((t) => ({
        id: t.id,
        participantName: t.residentName ?? t.unitLabel,
        context: t.residentName ? t.unitLabel : undefined,
        lastMessage: t.lastFromOffice ? `You: ${t.lastMessagePreview ?? ''}` : t.lastMessagePreview,
        lastMessageTime: t.lastMessageAt,
        unreadCount: t.unread ? 1 : 0,
      }))}
      loading={!estateId || query.isPending}
      error={query.isError}
      refreshing={query.isRefetching}
      onRefresh={() => void query.refetch()}
      onOpen={(c) => router.push(`/(app)/estate-resident-thread/${c.id}`)}
      emptyDescription="When a resident messages the estate office, the conversation appears here."
    />
  );
}
