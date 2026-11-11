'use client';

import { CollectionManager } from '@/components/collections/CollectionManager';
import { collectionsManager } from '@/services/collectionsService';

const manager = collectionsManager('/realtor/collections');

export default function RealtorCollectionsPage() {
  return (
    <CollectionManager
      manager={manager}
      queryKey={['collections', 'realtor']}
      description="Group live listings you own or are cleared to list into sets people can browse and share."
    />
  );
}
