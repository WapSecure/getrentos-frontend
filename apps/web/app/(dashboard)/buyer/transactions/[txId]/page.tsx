'use client';

import { useParams } from 'next/navigation';
import { TransactionWorkspaceView } from '@/components/shared/purchases/TransactionWorkspaceView';

export default function BuyerTransactionWorkspacePage() {
  const params = useParams<{ txId: string }>();
  return <TransactionWorkspaceView role="BUYER" txId={params?.txId ?? ''} />;
}
