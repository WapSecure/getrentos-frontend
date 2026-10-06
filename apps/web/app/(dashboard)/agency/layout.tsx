'use client';

import type { ReactNode } from 'react';
import { CustodyProvider } from '@/components/agency/CustodyProvider';
import { CustodyBar } from '@/components/agency/CustodyBar';

/**
 * The agency shell.
 *
 * A firm's portal is not an owner's portal with a different label. An owner looks
 * at everything they have; a manager looks at one client's things at a time, on
 * that client's instruction. So the shell is built around custody rather than
 * around a portfolio: the provider holds which client is selected, and the bar
 * states it on every screen inside here.
 *
 * Mounted once, at the layout, so the selection cannot disagree between two pages
 * and the bar cannot be forgotten by a page that was added later.
 */
export default function AgencyLayout({ children }: { children: ReactNode }) {
  return (
    <CustodyProvider>
      <div className="flex min-h-screen flex-col">
        <CustodyBar />
        <main className="flex-1">{children}</main>
      </div>
    </CustodyProvider>
  );
}
