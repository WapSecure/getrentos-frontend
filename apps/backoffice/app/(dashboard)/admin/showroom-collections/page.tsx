'use client';

import { EmptyState } from '@sureground/ui';
import { Lock } from '@sureground/icons';
import { useAdminUser } from '@/app/(dashboard)/admin/layout';
import { AdminCollectionsView } from '@/components/admin/collections/AdminCollectionsView';
import { hasAdminPermission } from '@/lib/adminAccess';
import { adminCollectionsService } from '@/services/adminCollectionsService';

export default function ShowroomCollectionsPage() {
  const user = useAdminUser();
  if (!hasAdminPermission(user?.roles, 'collections.manage')) {
    return (
      <EmptyState
        icon={Lock}
        title="You can’t manage collections"
        description="Ask an admin for the collections permission."
      />
    );
  }
  return (
    <AdminCollectionsView manager={adminCollectionsService} queryKey={['admin', 'collections']} />
  );
}
