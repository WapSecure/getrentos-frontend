import type { SetTransactionPinInput } from './api/security';

/**
 * Helpers for "add a factor to continue". A password alone no longer confirms
 * a sensitive change, so an account with no PIN, passkey or authenticator app
 * (step-up method `setup_required`) sets one up on the spot: a PIN, or a
 * passkey (Face ID / fingerprint).
 */

/** A new transaction PIN is six digits. */
export const PIN_LENGTH = 6;

/** A new PIN: exactly six digits. */
export const isNewPin = (pin: string) => /^\d{6}$/.test(pin);

/** A PIN the account already has: six digits, or four on older accounts. */
export const isCurrentPin = (pin: string) => /^(\d{4}|\d{6})$/.test(pin);

/** Only says "don't match" once the confirmation is fully typed. */
export const pinsMismatch = (pin: string, confirm: string) =>
  confirm.length === PIN_LENGTH && pin !== confirm;

/** A new PIN typed twice, the same both times. */
export const newPinReady = (pin: string, confirm: string) => isNewPin(pin) && pin === confirm;

/**
 * What proves a first (or forgotten) PIN, or earns the set-up-only token: the
 * password when the account has one, plus the emailed code.
 */
export const emailedProofReady = (input: {
  needsPassword: boolean;
  password: string;
  reference: string | null;
  code: string;
}) =>
  (!input.needsPassword || input.password.length > 0) &&
  !!input.reference &&
  /^\d{6}$/.test(input.code);

/**
 * The body for POST /users/me/security/transaction-pin. With `currentPin` it
 * changes an existing PIN; otherwise the emailed code sets a first PIN or
 * resets a forgotten one. The password is left out for accounts without one.
 */
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

/**
 * Adds a passkey for an account that has no factor yet. The password and the
 * emailed code earn a set-up-only token; it is held just long enough for the
 * two registration calls to carry it, then dropped, because any other route
 * would refuse it. The caller then confirms with the new passkey as usual.
 */
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
    const attestation = await deps.registerPasskey(options); // OS Face ID / fingerprint prompt
    await deps.finishPasskeyRegistration(attestation, input.deviceName);
  } finally {
    deps.clearStepUpToken();
  }
}
