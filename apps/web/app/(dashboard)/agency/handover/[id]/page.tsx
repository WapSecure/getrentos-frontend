'use client';

import { useParams } from 'next/navigation';
import { HandoverView } from '@/components/shared/handover/HandoverView';

export default function HandoverPage() {
  const { id } = useParams<{ id: string }>();
  return <HandoverView transferId={id} />;
}
