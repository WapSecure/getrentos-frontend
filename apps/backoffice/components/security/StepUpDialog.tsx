'use client';

import { StepUpDialog as SharedStepUpDialog } from '@sureground/ui';
import {
  startAuthentication,
  type PublicKeyCredentialRequestOptionsJSON,
} from '@simplewebauthn/browser';

const authenticateWithPasskey = (options: unknown) =>
  startAuthentication({ optionsJSON: options as PublicKeyCredentialRequestOptionsJSON });

/**
 * Mounted once at the root so admin actions that need a fresh confirmation
 * prompt for it and replay the request, instead of failing. Staff with no
 * factor yet confirm with their password and an emailed code, which only
 * opens two-factor set-up.
 */
export function StepUpDialog() {
  return (
    <SharedStepUpDialog
      authenticateWithPasskey={authenticateWithPasskey}
      // A PIN is not a staff factor: staff with none confirm for two-factor set-up.
      canSetPin={false}
      description="This is a sensitive admin action, so we check it’s really you before it goes through."
    />
  );
}
