'use client';

import { StepUpDialog as SharedStepUpDialog } from '@sureground/ui';
import {
  startAuthentication,
  type PublicKeyCredentialRequestOptionsJSON,
} from '@simplewebauthn/browser';

const authenticateWithPasskey = (options: unknown) =>
  startAuthentication({ optionsJSON: options as PublicKeyCredentialRequestOptionsJSON });

export function StepUpDialog() {
  return <SharedStepUpDialog authenticateWithPasskey={authenticateWithPasskey} />;
}
