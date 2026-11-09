'use client';

import { useSearchParams } from 'next/navigation';
import { ShortletOversight } from '@/components/admin/shortlets/ShortletOversight';

export default function AdminShortletsPage() {
  // The console reads its deep link once on open; keying on the query re-opens it when a header-search result points elsewhere.
  const query = useSearchParams().toString();
  return <ShortletOversight key={query} />;
}
