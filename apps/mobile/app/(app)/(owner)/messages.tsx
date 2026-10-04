import { router } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { qk } from '@/lib/query/keys';
import { ownerApi } from '@/lib/api/owner';
import { Inbox } from '@/components/messages/Inbox';

export default function OwnerMessages() {
  const query = useQuery({
    queryKey: qk.owner.conversations,
    queryFn: () => ownerApi.conversations(1, 50),
  });

  return (
    <Inbox
      subtitle="Buyers, realtors and agents"
      conversations={query.data?.items.map((c) => ({ ...c, context: c.propertyName }))}
      loading={query.isPending}
      error={query.isError}
      refreshing={query.isRefetching}
      onRefresh={() => query.refetch()}
      onOpen={(c) => router.push(`/(app)/owner-conversation/${c.id}`)}
      emptyDescription="Buyers who ask about your listings will appear here."
    />
  );
}
