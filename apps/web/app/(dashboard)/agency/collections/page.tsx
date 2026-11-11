'use client';

import { CollectionManager } from '@/components/collections/CollectionManager';
import { collectionsManager } from '@/services/collectionsService';

const manager = collectionsManager('/agency/collections');

export default function AgencyCollectionsPage() {
  return (
    <CollectionManager
      manager={manager}
      queryKey={['collections', 'agency']}
      description="Group live listings your firm holds or markets under a mandate into sets people can browse and share."
    />
  );
}
