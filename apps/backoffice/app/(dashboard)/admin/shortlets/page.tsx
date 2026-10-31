'use client';

import { useSearchParams } from 'next/navigation';
import { ShortletOversight } from '@/components/admin/shortlets/ShortletOversight';

export default function AdminShortletsPage() {
  // The console reads its deep link (?tab, ?bookingId, ?search) once when it
  // opens. Keying on the query re-opens it when a header-search result points
  // at a different record while staff are already here.
  const query = useSearchParams().toString();
  return <ShortletOversight key={query} />;
}
