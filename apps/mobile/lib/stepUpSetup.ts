import type { SetTransactionPinInput } from './api/security';

export const PIN_LENGTH = 6;

export const isNewPin = (pin: string) => /^\d{6}$/.test(pin);

/** Six digits, or four on older accounts. */
export const isCurrentPin = (pin: string) => /^(\d{4}|\d{6})$/.test(pin);

export const pinsMismatch = (pin: string, confirm: string) =>
  confirm.length === PIN_LENGTH && pin !== confirm;

export const newPinReady = (pin: string, confirm: string) => isNewPin(pin) && pin === confirm;

export const emailedProofReady = (input: {
  needsPassword: boolean;
  password: string;
  reference: string | null;
  code: string;
}) =>
  (!input.needsPassword || input.password.length > 0) &&
  !!input.reference &&
  /^\d{6}$/.test(input.code);

export function transactionPinBody(input: {
  password?: string;
  pin: string;
  currentPin?: string;
  reference?: string | null;
  code?: string;
}): SetTransactionPinInput {
  const body: SetTransactionPinInput = { pin: input.pin };
  if (input.password) body.currentPassword = input.password;
  if (input.currentPin) {
    body.currentPin = input.currentPin;
  } else {
    if (input.reference) body.reference = input.reference;
    if (input.code) body.code = input.code;
  }
  return body;
}

type Token = { stepUpToken: string; expiresIn: number };

export interface PasskeySetupDeps {
  confirmStepUp: (input: {
    password?: string;
    reference?: string;
    code?: string;
  }) => Promise<Token>;
  startPasskeyRegistration: () => Promise<Record<string, unknown>>;
  finishPasskeyRegistration: (response: unknown, deviceName?: string) => Promise<unknown>;
  registerPasskey: (options: Record<string, unknown>) => Promise<Record<string, unknown>>;
  rememberStepUpToken: (token: string, expiresIn: number) => void;
  clearStepUpToken: () => void;
}

// The set-up-only token is dropped after the two registration calls: any other route would refuse it.
export async function addPasskeyWithEmailedCode(
  deps: PasskeySetupDeps,
  input: { password?: string; reference: string; code: string; deviceName?: string }
): Promise<void> {
  const setup = await deps.confirmStepUp({
    ...(input.password ? { password: input.password } : {}),
    reference: input.reference,
    code: input.code,
  });
  deps.rememberStepUpToken(setup.stepUpToken, setup.expiresIn);
  try {
    const options = await deps.startPasskeyRegistration();
    const attestation = await deps.registerPasskey(options);
    await deps.finishPasskeyRegistration(attestation, input.deviceName);
  } finally {
    deps.clearStepUpToken();
  }
}
