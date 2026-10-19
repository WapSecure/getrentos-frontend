'use client';

import { useParams } from 'next/navigation';
import { RepresentedDealView } from '@/components/land/representatives/RepresentedDealView';

export default function RepresentedResalePage() {
  const params = useParams<{ txId: string }>();
  return <RepresentedDealView deal={{ transactionId: params?.txId ?? '' }} />;
}
