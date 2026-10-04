import { router } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { qk } from '@/lib/query/keys';
import { landlordApi } from '@/lib/api/landlord';
import { Inbox } from '@/components/messages/Inbox';
import { roleLabel } from '@/lib/format';

export default function LandlordMessages() {
  const query = useQuery({
    queryKey: qk.landlord.conversations,
    queryFn: () => landlordApi.conversations(1, 50),
  });

  return (
    <Inbox
      subtitle="Tenants, applicants and agents"
      conversations={query.data?.items.map((c) => ({
        ...c,
        context: roleLabel(c.participantRole),
      }))}
      loading={query.isPending}
      error={query.isError}
      refreshing={query.isRefetching}
      onRefresh={() => query.refetch()}
      onOpen={(c) =>
        router.push({
          pathname: '/(app)/landlord-conversation/[id]',
          params: { id: c.id, name: c.participantName },
        })
      }
      emptyDescription="Messages from tenants, applicants and agents land here."
    />
  );
}
