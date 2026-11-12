'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import type { PublicKeyCredentialRequestOptionsJSON } from '@simplewebauthn/browser';
import { hasStoredSession } from '@sureground/shared';
import { StepUpDialog as SharedStepUpDialog } from '@sureground/ui/StepUpDialog';

// Mounted on every page by the root layout, so signed-out visitors never download the WebAuthn library.
const loadWebAuthn = () => import('@simplewebauthn/browser');

const authenticateWithPasskey = async (options: unknown) => {
  const { startAuthentication } = await loadWebAuthn();
  return startAuthentication({ optionsJSON: options as PublicKeyCredentialRequestOptionsJSON });
};

export function StepUpDialog() {
  const pathname = usePathname();

  // Signed-in pages fetch it while idle, so a passkey prompt still opens straight from the click (Safari needs that).
  useEffect(() => {
    if (!hasStoredSession()) return;
    const preload = () => void loadWebAuthn().catch(() => {});
    if ('requestIdleCallback' in window) {
      const id = window.requestIdleCallback(preload, { timeout: 4000 });
      return () => window.cancelIdleCallback(id);
    }
    const id = setTimeout(preload, 2000);
    return () => clearTimeout(id);
  }, [pathname]);

  return <SharedStepUpDialog authenticateWithPasskey={authenticateWithPasskey} />;
}
