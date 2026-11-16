'use client';

import type { ReactNode } from 'react';
import { QueryProvider } from '@sureground/ui/providers/QueryProvider';
import { useAuthStore } from '@/lib/store/authStore';
import { isPublicWebPath } from '@/lib/sessionRoutes';

const showSignedOut = () => useAuthStore.getState().setAuthenticated(false);

export function WebQueryProvider({ children }: { children: ReactNode }) {
  return (
    <QueryProvider isPublicPath={isPublicWebPath} onSignedOutInPlace={showSignedOut}>
      {children}
    </QueryProvider>
  );
}
