import { Passkey } from 'react-native-passkey';

/**
 * Thin wrapper over react-native-passkey (iOS ASAuthorization / Android
 * Credential Manager). It keeps the native dependency in one place and
 * normalises the result into the WebAuthn JSON shape the backend verifies with
 * @simplewebauthn: the native result can omit `type`/`rawId`, which the server
 * expects, so we fill them in.
 *
 * Requires a native/EAS build and hosted association files (apple-app-site-
 * association / assetlinks.json) on the RP domain — it does not work in Expo Go
 * or against localhost.
 */
export function isPasskeySupported(): boolean {
  try {
    return Passkey.isSupported();
  } catch {
    return false;
  }
}

function normalise(result: unknown): Record<string, unknown> {
  const r = (result ?? {}) as Record<string, unknown>;
  return { ...r, type: 'public-key', rawId: (r.rawId as string) ?? (r.id as string) };
}

/** Runs the OS registration ceremony with server options; returns the attestation JSON. */
export async function registerPasskey(options: Record<string, unknown>): Promise<Record<string, unknown>> {
  const result = await Passkey.create(options as never);
  return normalise(result);
}

/** Runs the OS assertion ceremony with server options; returns the assertion JSON. */
export async function authenticatePasskey(
  options: Record<string, unknown>,
): Promise<Record<string, unknown>> {
  const result = await Passkey.get(options as never);
  return normalise(result);
}
