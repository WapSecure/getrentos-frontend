'use client';

import type { ReactNode } from 'react';
import { SessionTimeoutGuard } from '@getrentos/ui';
import { ROUTES } from '@getrentos/shared';

/**
 * Shared shell for the back office. Same job as the main app's dashboard
 * layout: one session-activity guard for the whole signed-in area, pointed at
 * the admin sign-in screen rather than the consumer one.
 */
export default function AdminDashboardLayout({ children }: { children: ReactNode }) {
  return (
    <>
      {children}
      <SessionTimeoutGuard redirectTo={ROUTES.ADMIN_LOGIN} />
    </>
  );
}
