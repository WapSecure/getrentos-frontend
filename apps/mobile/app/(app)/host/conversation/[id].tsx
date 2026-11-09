import { useLocalSearchParams } from 'expo-router';
import { qk } from '@/lib/query/keys';
import { hostShortletsApi } from '@/lib/api/hostShortlets';
import { ConversationThread } from '@/components/shortlet/ConversationThread';

export default function HostConversationScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return (
    <ConversationThread
      id={id}
      queryKey={qk.host.conversations}
      list={() => hostShortletsApi.conversations()}
      send={hostShortletsApi.send}
      markRead={hostShortletsApi.markRead}
      fallbackName="Guest"
    />
  );
}
