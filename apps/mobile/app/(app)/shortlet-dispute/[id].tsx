import { useLocalSearchParams } from 'expo-router';
import { qk } from '@/lib/query/keys';
import { shortletsApi } from '@/lib/api/shortlets';
import { GUEST_DISPUTE_CATEGORIES } from '@/lib/stays';
import { DisputeThread } from '@/components/shortlet/DisputeThread';

const listDisputes = () => shortletsApi.disputes();

/** One dispute from the guest's side: what was raised and the thread with support. */
export default function GuestDisputeDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return (
    <DisputeThread
      id={id}
      disputesKey={qk.shortlets.disputes}
      listDisputes={listDisputes}
      messagesKey={qk.shortlets.disputeMessages(id)}
      listMessages={shortletsApi.disputeMessages}
      sendMessage={shortletsApi.sendDisputeMessage}
      categoryLabel={(c) => GUEST_DISPUTE_CATEGORIES.find((x) => x.value === c)?.label ?? c}
      refundText={(n) => `₦${n.toLocaleString('en-NG')} was refunded to you.`}
    />
  );
}
