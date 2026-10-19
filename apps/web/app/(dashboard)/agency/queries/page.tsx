'use client';

import { QueryThreads } from '@/components/shared/queries/QueryThreads';

export default function AgencyQueriesPage() {
  return (
    <div className="p-6">
      <QueryThreads as="manager" />
    </div>
  );
}
