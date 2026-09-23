'use client';

import type { ReactNode } from 'react';
import { SessionTimeoutGuard } from '@getrentos/ui';

/**
 * Shared shell for every signed-in area of the main app.
 *
 * The per-role layouts below own their own navbar/sidebar, so this one is
 * deliberately empty apart from the session-activity guard — the single piece
 * that must behave identically for every role. Mounting it here keeps one
 * dialog and one activity timer for the whole signed-in surface, instead of
 * nine independent copies that could disagree.
 */
export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <>
      {children}
      <SessionTimeoutGuard />
    </>
  );
}
