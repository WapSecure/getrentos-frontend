'use client';

import type { ReactNode } from 'react';
import { SessionTimeoutGuard } from '@sureground/ui';
import { ROUTES } from '@sureground/shared';

export default function AdminDashboardLayout({ children }: { children: ReactNode }) {
  return (
    <>
      {children}
      <SessionTimeoutGuard redirectTo={ROUTES.ADMIN_LOGIN} />
    </>
  );
}
