'use client';

import { useParams } from 'next/navigation';
import { TransactionWorkspaceView } from '@/components/shared/purchases/TransactionWorkspaceView';

export default function RepresentedTransactionWorkspacePage() {
  const params = useParams<{ txId: string }>();
  return <TransactionWorkspaceView role="REPRESENTATIVE" txId={params?.txId ?? ''} />;
}
