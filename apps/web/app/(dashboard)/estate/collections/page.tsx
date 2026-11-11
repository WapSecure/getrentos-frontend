'use client';

import { useMemo } from 'react';
import { ListSkeleton } from '@sureground/ui';
import { useSelectedEstate } from '@/app/(dashboard)/estate/layout';
import { CollectionManager } from '@/components/collections/CollectionManager';
import { collectionsManager } from '@/services/collectionsService';

export default function EstateCollectionsPage() {
  const { estate, isLoading } = useSelectedEstate();
  const manager = useMemo(
    () => (estate ? collectionsManager(`/estates/${estate.id}/collections`) : null),
    [estate]
  );
  if (isLoading || !manager || !estate) return <ListSkeleton />;
  return (
    <CollectionManager
      manager={manager}
      queryKey={['collections', 'estate', estate.id]}
      description="Group live listings in your estate into sets people can browse and share. They also show on your estate page."
    />
  );
}
