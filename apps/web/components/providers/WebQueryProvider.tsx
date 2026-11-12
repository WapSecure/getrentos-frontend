'use client';

import type { ReactNode } from 'react';
import { isPublicWebPath } from '@sureground/shared';
import { QueryProvider } from '@sureground/ui/providers/QueryProvider';
import { useAuthStore } from '@/lib/store/authStore';

const showSignedOut = () => useAuthStore.getState().setAuthenticated(false);

/** Public pages drop an ended session in place; signed-in areas still go to sign-in. */
export function WebQueryProvider({ children }: { children: ReactNode }) {
  return (
    <QueryProvider isPublicPath={isPublicWebPath} onSignedOutInPlace={showSignedOut}>
      {children}
    </QueryProvider>
  );
}
