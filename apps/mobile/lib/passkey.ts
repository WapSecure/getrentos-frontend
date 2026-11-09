import { Passkey } from 'react-native-passkey';

// The native result can omit `type`/`rawId`, which the server expects, so we fill them in.
// Needs a native build and hosted association files on the RP domain; not Expo Go or localhost.
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

export async function registerPasskey(
  options: Record<string, unknown>
): Promise<Record<string, unknown>> {
  const result = await Passkey.create(options as never);
  return normalise(result);
}

export async function authenticatePasskey(
  options: Record<string, unknown>
): Promise<Record<string, unknown>> {
  const result = await Passkey.get(options as never);
  return normalise(result);
}
