'use client';

import { useParams } from 'next/navigation';
import { ReviewSeatDetail } from '@/components/land/reviews/ReviewSeatDetail';

export default function LandReviewSeatPage() {
  const params = useParams<{ seatId: string }>();
  return <ReviewSeatDetail seatId={params?.seatId ?? ''} />;
}
