'use client';

import type { ReactNode } from 'react';
import { QueryProvider } from '@sureground/ui/providers/QueryProvider';
import { useAuthStore } from '@/lib/store/authStore';
import { isPublicWebPath } from '@/lib/sessionRoutes';
import { onSignOut } from '@/lib/apiClient';

const showSignedOut = () => useAuthStore.getState().setAuthenticated(false);

// Menu, idle and account-deletion sign-outs all end in logoutSession, so device data is dropped here once.
if (typeof window !== 'undefined') {
  onSignOut(async () => {
    const [{ clearAgentDeviceRecords }, { disconnectRealtime }] = await Promise.all([
      import('@/lib/agentOfflineQueue'),
      import('@/lib/realtime/socket'),
    ]);
    disconnectRealtime();
    await clearAgentDeviceRecords();
  });
}

export function WebQueryProvider({ children }: { children: ReactNode }) {
  return (
    <QueryProvider isPublicPath={isPublicWebPath} onSignedOutInPlace={showSignedOut}>
      {children}
    </QueryProvider>
  );
}
