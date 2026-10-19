'use client';

import { useParams } from 'next/navigation';
import { RepresentedDealView } from '@/components/land/representatives/RepresentedDealView';

export default function RepresentedPurchasePage() {
  const params = useParams<{ purchaseId: string }>();
  return <RepresentedDealView deal={{ purchaseId: params?.purchaseId ?? '' }} />;
}
