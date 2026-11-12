import { Suspense } from 'react';
import { ListSkeleton, PageHeader } from '@sureground/ui';
import { ListingCollectionsDesk } from '@/components/collections/ListingCollectionsDesk';

export default function ListingCollectionsPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Your listings in Sureground collections"
        description="The Sureground team sometimes puts live listings into collections on the site. You can take yours out at any time, and keep it out."
      />
      <Suspense fallback={<ListSkeleton />}>
        <ListingCollectionsDesk />
      </Suspense>
    </div>
  );
}
