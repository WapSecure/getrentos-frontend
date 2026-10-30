'use client';

import { StepUpDialog as SharedStepUpDialog } from '@getrentos/ui';
import {
  startAuthentication,
  type PublicKeyCredentialRequestOptionsJSON,
} from '@simplewebauthn/browser';

const authenticateWithPasskey = (options: unknown) =>
  startAuthentication({ optionsJSON: options as PublicKeyCredentialRequestOptionsJSON });

/** Mounted once at the root; see the shared dialog for how step-up works. */
export function StepUpDialog() {
  return <SharedStepUpDialog authenticateWithPasskey={authenticateWithPasskey} />;
}
