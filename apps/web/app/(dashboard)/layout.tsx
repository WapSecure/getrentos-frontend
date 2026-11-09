'use client';

import type { ReactNode } from 'react';
import { SessionTimeoutGuard } from '@sureground/ui';
import { AddRoleDialogHost } from '@/components/shared/navigation/AddRoleDialog';
import { SkipToMainLink } from '@/components/shared/navigation/SkipToMainLink';

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <SkipToMainLink />
      {children}
      <SessionTimeoutGuard />
      <AddRoleDialogHost />
    </>
  );
}
