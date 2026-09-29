import { useLocalSearchParams } from 'expo-router';
import { qk } from '@/lib/query/keys';
import { shortletsApi } from '@/lib/api/shortlets';
import { ConversationThread } from '@/components/shortlet/ConversationThread';

const list = () => shortletsApi.conversations();

/** One host thread, from the guest's side. */
export default function GuestConversationScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return (
    <ConversationThread
      id={id}
      queryKey={qk.shortlets.conversations}
      list={list}
      send={shortletsApi.send}
      markRead={shortletsApi.markRead}
      fallbackName="Host"
    />
  );
}
