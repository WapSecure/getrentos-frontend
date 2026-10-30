'use client';

import { StepUpDialog as SharedStepUpDialog } from '@getrentos/ui';
import {
  startAuthentication,
  type PublicKeyCredentialRequestOptionsJSON,
} from '@simplewebauthn/browser';

const authenticateWithPasskey = (options: unknown) =>
  startAuthentication({ optionsJSON: options as PublicKeyCredentialRequestOptionsJSON });

/**
 * Mounted once at the root so admin actions that need a fresh confirmation
 * prompt for it and replay the request, instead of failing.
 */
export function StepUpDialog() {
  return (
    <SharedStepUpDialog
      authenticateWithPasskey={authenticateWithPasskey}
      description="This is a sensitive admin action, so we check it’s really you before it goes through."
    />
  );
}
