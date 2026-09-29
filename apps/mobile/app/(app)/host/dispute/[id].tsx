import { useLocalSearchParams } from 'expo-router';
import { qk } from '@/lib/query/keys';
import { DISPUTE_CATEGORIES, hostShortletsApi } from '@/lib/api/hostShortlets';
import { DisputeThread } from '@/components/shortlet/DisputeThread';

const listDisputes = () => hostShortletsApi.disputes();

/** One dispute: what was raised, where it stands, and the thread with support and the guest. */
export default function HostDisputeDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return (
    <DisputeThread
      id={id}
      disputesKey={qk.host.disputes}
      listDisputes={listDisputes}
      messagesKey={qk.host.disputeMessages(id)}
      listMessages={hostShortletsApi.disputeMessages}
      sendMessage={hostShortletsApi.sendDisputeMessage}
      categoryLabel={(c) => DISPUTE_CATEGORIES.find((x) => x.value === c)?.label ?? c}
      refundText={(n) => `₦${n.toLocaleString('en-NG')} was refunded to the guest.`}
    />
  );
}
