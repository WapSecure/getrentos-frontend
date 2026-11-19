const mockPlatform = { OS: 'ios' };

jest.mock('react-native', () => ({ Platform: mockPlatform }));

jest.mock('expo-secure-store', () => {
  const entries = new Map<string, string>();
  const id = (key: string, options?: { keychainService?: string }) =>
    `${options?.keychainService ?? 'default'}:${key}`;
  return {
    WHEN_UNLOCKED_THIS_DEVICE_ONLY: 5,
    canUseBiometricAuthentication: jest.fn(() => true),
    getItemAsync: jest.fn(async (key: string, options?: { keychainService?: string }) => {
      return entries.get(id(key, options)) ?? null;
    }),
    setItemAsync: jest.fn(
      async (key: string, value: string, options?: { keychainService?: string }) => {
        entries.set(id(key, options), value);
      }
    ),
    deleteItemAsync: jest.fn(async (key: string, options?: { keychainService?: string }) => {
      entries.delete(id(key, options));
    }),
    __entries: entries,
  };
});

jest.mock('expo-local-authentication', () => ({
  AuthenticationType: { FINGERPRINT: 1, FACIAL_RECOGNITION: 2 },
  hasHardwareAsync: jest.fn(async () => true),
  isEnrolledAsync: jest.fn(async () => true),
  supportedAuthenticationTypesAsync: jest.fn(async () => [2]),
  authenticateAsync: jest.fn(async () => ({ success: true })),
}));

// A stand-in for native AES-GCM: decrypting with any other key fails, like a real auth tag check.
jest.mock('expo-crypto', () => {
  let next = 0;
  const makeKey = (id: string) => ({ id, encoded: async () => id });
  const sealedFrom = (combined: string) => {
    const parsed = JSON.parse(atob(combined)) as { k: string; p: string };
    return { ...parsed, combined: async () => combined };
  };
  return {
    AESKeySize: { AES128: 128, AES192: 192, AES256: 256 },
    AESEncryptionKey: {
      generate: jest.fn(async () => makeKey(`key-${++next}`)),
      import: jest.fn(async (encoded: string) => makeKey(encoded)),
    },
    AESSealedData: { fromCombined: (combined: string) => sealedFrom(combined) },
    aesEncryptAsync: jest.fn(async (plain: string, key: { id: string }) =>
      sealedFrom(btoa(JSON.stringify({ k: key.id, p: plain })))
    ),
    aesDecryptAsync: jest.fn(async (sealed: { k: string; p: string }, key: { id: string }) => {
      if (sealed.k !== key.id) throw new Error('authentication tag mismatch');
      return sealed.p;
    }),
  };
});

type SecureStoreMock = typeof import('expo-secure-store') & {
  __entries: Map<string, string>;
  canUseBiometricAuthentication: jest.Mock;
  getItemAsync: jest.Mock;
  setItemAsync: jest.Mock;
  deleteItemAsync: jest.Mock;
};

type AsyncStorageStatic = typeof import('@react-native-async-storage/async-storage').default;

// The setup file's mock is CommonJS, so there is no `default` export to read.
const asyncStorage = (mod: AsyncStorageStatic | { default: AsyncStorageStatic }) =>
  'default' in mod ? mod.default : mod;

/* eslint-disable @typescript-eslint/no-require-imports */
function load(os: 'ios' | 'android' | 'web' = 'ios') {
  mockPlatform.OS = os;
  jest.resetModules();
  return {
    SecureStore: require('expo-secure-store') as SecureStoreMock,
    AsyncStorage: asyncStorage(require('@react-native-async-storage/async-storage')),
    LocalAuthentication: require('expo-local-authentication') as {
      isEnrolledAsync: jest.Mock;
    },
    lockedSession: require('@/lib/auth/lockedSession') as typeof import('@/lib/auth/lockedSession'),
    tokenStore: require('@/lib/auth/tokenStore') as typeof import('@/lib/auth/tokenStore'),
    appLock: require('@/lib/appLock') as typeof import('@/lib/appLock'),
  };
}
/* eslint-enable @typescript-eslint/no-require-imports */

const LOCK_KEY = 'sureground.locked:sureground.lockKey';
const SEALED = 'default:sureground.sealedRefreshToken';
const PER_TOKEN = 'sureground.locked:sureground.lockedRefreshToken';
const PER_TOKEN_MARKER = 'default:sureground.lockedSession';
const PLAIN_REFRESH = 'default:sureground.refreshToken';
const PLAIN_ACCESS = 'default:sureground.accessToken';
const FLAG = 'default:sureground.appLock';

type AuthOptions = { requireAuthentication?: boolean } | undefined;

/** Fails only the biometric read of the key, as the OS prompt does. */
function rejectKeyRead(SecureStore: SecureStoreMock, error: Error) {
  const read = SecureStore.getItemAsync.getMockImplementation()!;
  SecureStore.getItemAsync.mockImplementation(async (key: string, options?: unknown) => {
    if (key === 'sureground.lockKey') throw error;
    return read(key, options);
  });
}

/** Calls that show the OS prompt: any auth-bound read, and on Android any auth-bound write. */
function promptCount(SecureStore: SecureStoreMock, os: 'ios' | 'android') {
  const auth = (calls: unknown[][], optionsAt: number) =>
    calls.filter((call) => (call[optionsAt] as AuthOptions)?.requireAuthentication).length;
  return (
    auth(SecureStore.getItemAsync.mock.calls, 1) +
    (os === 'android' ? auth(SecureStore.setItemAsync.mock.calls, 2) : 0)
  );
}

afterEach(() => {
  jest.clearAllMocks();
});

describe('app lock flag', () => {
  it('moves a flag an older build left in AsyncStorage into secure storage, then deletes it', async () => {
    const { SecureStore, AsyncStorage, appLock } = load();
    await AsyncStorage.setItem('sureground.appLock', '1');

    await expect(appLock.loadAppLockFlag()).resolves.toBe(true);

    expect(SecureStore.__entries.get(FLAG)).toBe('1');
    expect(await AsyncStorage.getItem('sureground.appLock')).toBeNull();
    expect(appLock.isAppLockEnabled()).toBe(true);
  });

  it('keeps the secure flag when an AsyncStorage copy is also there, and still deletes that copy', async () => {
    const { SecureStore, AsyncStorage, appLock } = load();
    SecureStore.__entries.set(FLAG, '0');
    await AsyncStorage.setItem('sureground.appLock', '1');

    await expect(appLock.loadAppLockFlag()).resolves.toBe(false);
    expect(await AsyncStorage.getItem('sureground.appLock')).toBeNull();
  });

  it('keeps the AsyncStorage flag when secure storage refuses it, so the lock is not lost', async () => {
    const { SecureStore, AsyncStorage, appLock } = load();
    await AsyncStorage.setItem('sureground.appLock', '1');
    SecureStore.setItemAsync.mockRejectedValueOnce(new Error('keychain unavailable'));

    await expect(appLock.loadAppLockFlag()).resolves.toBe(true);
    expect(await AsyncStorage.getItem('sureground.appLock')).toBe('1');
  });

  it('is off when nothing was saved', async () => {
    const { appLock } = load();
    await expect(appLock.loadAppLockFlag()).resolves.toBe(false);
  });

  it('saves to secure storage only', async () => {
    const { SecureStore, AsyncStorage, appLock } = load();
    await appLock.saveAppLockFlag(true);
    expect(SecureStore.__entries.get(FLAG)).toBe('1');
    expect(await AsyncStorage.getItem('sureground.appLock')).toBeNull();
  });
});

describe.each(['ios', 'android'] as const)('locked session on %s', (os) => {
  it('puts only the key behind biometrics and seals the token in a plain entry', async () => {
    const { SecureStore, tokenStore, lockedSession } = load(os);
    await tokenStore.writeTokens({ accessToken: 'access', refreshToken: 'refresh-1' });

    await lockedSession.lockSession('refresh-1');

    expect(SecureStore.setItemAsync).toHaveBeenCalledWith(
      'sureground.lockKey',
      expect.any(String),
      expect.objectContaining({
        requireAuthentication: true,
        keychainService: 'sureground.locked',
        authenticationPrompt: expect.any(String),
      })
    );
    const sealedWrite = SecureStore.setItemAsync.mock.calls.find(
      ([key]) => key === 'sureground.sealedRefreshToken'
    );
    expect(sealedWrite?.[2]).not.toHaveProperty('requireAuthentication');
    expect(SecureStore.__entries.get(SEALED)).not.toContain('refresh-1');
    expect(SecureStore.__entries.has(PLAIN_REFRESH)).toBe(false);
    expect(SecureStore.__entries.has(PLAIN_ACCESS)).toBe(false);
    await expect(lockedSession.lockedSessionFormat()).resolves.toBe('sealed');
  });

  it('asks for the biometric exactly once when the lock is turned on', async () => {
    const { SecureStore, lockedSession } = load(os);
    await lockedSession.lockSession('refresh-1', { prove: true });
    expect(promptCount(SecureStore, os)).toBe(1);
  });

  it('unlocks with one prompt and returns the token', async () => {
    const { SecureStore, lockedSession } = load(os);
    await lockedSession.lockSession('refresh-1');
    lockedSession.forgetLockKey();
    jest.clearAllMocks();

    await expect(lockedSession.unlockLockedSession()).resolves.toEqual({
      status: 'ok',
      refreshToken: 'refresh-1',
    });
    expect(promptCount(SecureStore, os)).toBe(1);
  });

  it('re-seals a rotated token with the in-memory key, without a prompt', async () => {
    const { SecureStore, lockedSession } = load(os);
    await lockedSession.lockSession('refresh-1');
    lockedSession.forgetLockKey();
    await lockedSession.unlockLockedSession();
    jest.clearAllMocks();

    await expect(lockedSession.resealRefreshToken('refresh-2')).resolves.toBe(true);
    await expect(lockedSession.resealRefreshToken('refresh-3')).resolves.toBe(true);
    expect(promptCount(SecureStore, os)).toBe(0);
    expect(SecureStore.setItemAsync).not.toHaveBeenCalledWith(
      'sureground.lockKey',
      expect.anything(),
      expect.anything()
    );

    lockedSession.forgetLockKey();
    await expect(lockedSession.unlockLockedSession()).resolves.toEqual({
      status: 'ok',
      refreshToken: 'refresh-3',
    });
  });

  it('cannot re-seal once the app locks, because the key is dropped', async () => {
    const { SecureStore, lockedSession, appLock } = load(os);
    await lockedSession.lockSession('refresh-1');
    appLock.setAppLocked(true);
    jest.clearAllMocks();

    await expect(lockedSession.resealRefreshToken('refresh-2')).resolves.toBe(false);
    expect(promptCount(SecureStore, os)).toBe(0);
  });

  it('treats an invalidated key (biometrics changed) as gone, so the person signs in again', async () => {
    const { SecureStore, lockedSession } = load(os);
    await lockedSession.lockSession('refresh-1');
    lockedSession.forgetLockKey();
    SecureStore.getItemAsync.mockImplementation(async (key: string) =>
      key === 'sureground.lockKey' ? null : (SecureStore.__entries.get(`default:${key}`) ?? null)
    );

    await expect(lockedSession.unlockLockedSession()).resolves.toEqual({ status: 'gone' });
    SecureStore.getItemAsync.mockReset();
  });

  it('treats a token sealed under another key as gone', async () => {
    const { SecureStore, lockedSession } = load(os);
    await lockedSession.lockSession('refresh-1');
    const sealed = SecureStore.__entries.get(SEALED)!;
    await lockedSession.lockSession('refresh-other');
    SecureStore.__entries.set(SEALED, sealed);
    SecureStore.__entries.set(LOCK_KEY, 'key-unknown');
    lockedSession.forgetLockKey();

    await expect(lockedSession.unlockLockedSession()).resolves.toEqual({ status: 'gone' });
  });

  it('reports a dismissed prompt as cancelled and keeps the session', async () => {
    const { SecureStore, lockedSession } = load(os);
    await lockedSession.lockSession('refresh-1');
    rejectKeyRead(SecureStore, new Error('User canceled the authentication'));

    await expect(lockedSession.unlockLockedSession()).resolves.toEqual({ status: 'cancelled' });
    await expect(lockedSession.lockedSessionFormat()).resolves.toBe('sealed');
  });

  it('reports any other prompt failure without throwing', async () => {
    const { SecureStore, lockedSession } = load(os);
    await lockedSession.lockSession('refresh-1');
    rejectKeyRead(SecureStore, new Error('Biometry is locked out.'));
    await expect(lockedSession.unlockLockedSession()).resolves.toEqual({ status: 'failed' });
  });

  it('keeps the plain session when the biometric save is cancelled', async () => {
    const { SecureStore, tokenStore, lockedSession } = load(os);
    await tokenStore.writeTokens({ accessToken: 'access', refreshToken: 'refresh-1' });
    SecureStore.setItemAsync.mockImplementationOnce(async () => {
      throw new Error('User canceled the authentication');
    });

    await expect(lockedSession.lockSession('refresh-1')).rejects.toThrow();

    expect(SecureStore.__entries.get(PLAIN_REFRESH)).toBe('refresh-1');
    await expect(lockedSession.lockedSessionFormat()).resolves.toBeNull();
  });

  it('moves the session back to plain storage and deletes the key when the lock is turned off', async () => {
    const { SecureStore, lockedSession } = load(os);
    await lockedSession.lockSession('refresh-1');

    await lockedSession.storeUnlockedSession({ accessToken: null, refreshToken: 'refresh-1' });

    expect(SecureStore.__entries.get(PLAIN_REFRESH)).toBe('refresh-1');
    expect(SecureStore.__entries.has(PLAIN_ACCESS)).toBe(false);
    expect(SecureStore.__entries.has(LOCK_KEY)).toBe(false);
    expect(SecureStore.__entries.has(SEALED)).toBe(false);
    const plainWrite = SecureStore.setItemAsync.mock.calls.find(
      ([key]) => key === 'sureground.refreshToken'
    );
    expect(plainWrite?.[2]).not.toHaveProperty('requireAuthentication');
    await expect(lockedSession.lockedSessionFormat()).resolves.toBeNull();
  });

  it('migrates a session saved in plain storage by locking it with one prompt', async () => {
    const { SecureStore, tokenStore, lockedSession } = load(os);
    await tokenStore.writeTokens({ accessToken: 'access', refreshToken: 'refresh-1' });
    await expect(lockedSession.lockedSessionFormat()).resolves.toBeNull();
    jest.clearAllMocks();

    await lockedSession.lockSession('refresh-1', { prove: true });

    expect(promptCount(SecureStore, os)).toBe(1);
    expect(SecureStore.__entries.has(PLAIN_REFRESH)).toBe(false);
    lockedSession.forgetLockKey();
    await expect(lockedSession.unlockLockedSession()).resolves.toEqual({
      status: 'ok',
      refreshToken: 'refresh-1',
    });
  });

  it('migrates a session whose token itself was behind biometrics', async () => {
    const { SecureStore, lockedSession } = load(os);
    SecureStore.__entries.set(PER_TOKEN, 'refresh-1');
    SecureStore.__entries.set(PER_TOKEN_MARKER, '1');
    await expect(lockedSession.lockedSessionFormat()).resolves.toBe('perToken');

    await expect(lockedSession.unlockLockedSession()).resolves.toEqual({
      status: 'ok',
      refreshToken: 'refresh-1',
    });

    expect(SecureStore.__entries.has(PER_TOKEN)).toBe(false);
    expect(SecureStore.__entries.has(PER_TOKEN_MARKER)).toBe(false);
    await expect(lockedSession.lockedSessionFormat()).resolves.toBe('sealed');
    await expect(lockedSession.resealRefreshToken('refresh-2')).resolves.toBe(true);
  });
});

it('recreates the iOS key entry rather than updating it, so creating it never prompts', async () => {
  const { SecureStore, lockedSession } = load('ios');
  await lockedSession.lockSession('refresh-1');
  expect(SecureStore.deleteItemAsync).toHaveBeenCalledWith(
    'sureground.lockKey',
    expect.objectContaining({ keychainService: 'sureground.locked' })
  );
});

describe('biometric capability', () => {
  it('cannot lock on the web', () => {
    const { lockedSession } = load('web');
    expect(lockedSession.canLockWithBiometrics()).toBe(false);
  });

  it('cannot lock when the check itself throws', () => {
    const { SecureStore, lockedSession } = load('android');
    SecureStore.canUseBiometricAuthentication.mockImplementationOnce(() => {
      throw new Error('unavailable');
    });
    expect(lockedSession.canLockWithBiometrics()).toBe(false);
  });

  it('does not offer the lock when no biometrics are enrolled', async () => {
    const { LocalAuthentication, appLock } = load('ios');
    LocalAuthentication.isEnrolledAsync.mockResolvedValueOnce(false);
    await expect(appLock.biometricSupport()).resolves.toMatchObject({
      available: false,
      canLock: false,
    });
  });

  it('does not offer the lock when the biometrics are too weak to bind a key to', async () => {
    const { SecureStore, appLock } = load('android');
    SecureStore.canUseBiometricAuthentication.mockReturnValueOnce(false);
    await expect(appLock.biometricSupport()).resolves.toMatchObject({
      available: true,
      canLock: false,
    });
  });
});

describe('refresh gating', () => {
  const settled = async (promise: Promise<void>) => {
    let done = false;
    void promise.then(() => {
      done = true;
    });
    await Promise.resolve();
    await Promise.resolve();
    return done;
  };

  it('lets a refresh through at once when the lock is off', async () => {
    const { appLock } = load();
    await appLock.saveAppLockFlag(false);
    expect(await settled(appLock.waitUntilUnlocked())).toBe(true);
  });

  it('holds a refresh while locked and releases it on unlock', async () => {
    const { appLock } = load();
    await appLock.saveAppLockFlag(true);
    appLock.setAppLocked(true);
    const wait = appLock.waitUntilUnlocked();
    expect(await settled(wait)).toBe(false);

    appLock.setAppLocked(false);
    expect(await settled(wait)).toBe(true);
  });

  it('holds a refresh while the app is in the background, even when unlocked', async () => {
    const { appLock } = load();
    await appLock.saveAppLockFlag(true);
    appLock.setAppLocked(false);
    appLock.setAppForeground(false);
    const wait = appLock.waitUntilUnlocked();
    expect(await settled(wait)).toBe(false);

    appLock.setAppForeground(true);
    expect(await settled(wait)).toBe(true);
  });
});
