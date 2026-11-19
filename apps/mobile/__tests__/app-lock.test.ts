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

const LOCKED = 'sureground.locked:sureground.lockedRefreshToken';
const PLAIN_REFRESH = 'default:sureground.refreshToken';
const PLAIN_ACCESS = 'default:sureground.accessToken';
const MARKER = 'default:sureground.lockedSession';
const FLAG = 'default:sureground.appLock';

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

describe('locked session storage', () => {
  it('saves the refresh token behind biometrics and drops the plain copies', async () => {
    const { SecureStore, tokenStore, lockedSession } = load('ios');
    await tokenStore.writeTokens({ accessToken: 'access', refreshToken: 'refresh-1' });

    await lockedSession.storeLockedSession('refresh-2');

    expect(SecureStore.__entries.get(LOCKED)).toBe('refresh-2');
    expect(SecureStore.__entries.get(MARKER)).toBe('1');
    expect(SecureStore.__entries.has(PLAIN_REFRESH)).toBe(false);
    expect(SecureStore.__entries.has(PLAIN_ACCESS)).toBe(false);
    expect(SecureStore.setItemAsync).toHaveBeenCalledWith(
      'sureground.lockedRefreshToken',
      'refresh-2',
      expect.objectContaining({
        requireAuthentication: true,
        keychainService: 'sureground.locked',
        authenticationPrompt: expect.any(String),
      })
    );
  });

  it('recreates the iOS entry rather than updating it, so a rotation does not prompt', async () => {
    const { SecureStore, lockedSession } = load('ios');
    await lockedSession.storeLockedSession('refresh-1');
    SecureStore.deleteItemAsync.mockClear();
    SecureStore.getItemAsync.mockClear();

    await lockedSession.storeLockedSession('refresh-2');

    expect(SecureStore.deleteItemAsync).toHaveBeenCalledWith(
      'sureground.lockedRefreshToken',
      expect.objectContaining({ keychainService: 'sureground.locked' })
    );
    const lockedReads = SecureStore.getItemAsync.mock.calls.filter(
      ([key]) => key === 'sureground.lockedRefreshToken'
    );
    expect(lockedReads).toHaveLength(0);
  });

  it('reads the entry back on iOS when turning the lock on, so the biometric is proven once', async () => {
    const { SecureStore, lockedSession } = load('ios');
    await lockedSession.storeLockedSession('refresh-1', { prove: true });
    expect(SecureStore.getItemAsync).toHaveBeenCalledWith(
      'sureground.lockedRefreshToken',
      expect.objectContaining({
        requireAuthentication: true,
        authenticationPrompt: 'Unlock Sureground',
      })
    );
  });

  it('does not read back on Android, where saving already asks for the biometric', async () => {
    const { SecureStore, lockedSession } = load('android');
    await lockedSession.storeLockedSession('refresh-1', { prove: true });
    const lockedReads = SecureStore.getItemAsync.mock.calls.filter(
      ([key]) => key === 'sureground.lockedRefreshToken'
    );
    expect(lockedReads).toHaveLength(0);
    expect(SecureStore.__entries.get(LOCKED)).toBe('refresh-1');
  });

  it('leaves no marker and keeps the plain session when the biometric save is cancelled', async () => {
    const { SecureStore, tokenStore, lockedSession } = load('android');
    await tokenStore.writeTokens({ accessToken: 'access', refreshToken: 'refresh-1' });
    SecureStore.setItemAsync.mockRejectedValueOnce(new Error('User canceled the authentication'));

    await expect(lockedSession.storeLockedSession('refresh-1')).rejects.toThrow();

    expect(SecureStore.__entries.has(MARKER)).toBe(false);
    expect(SecureStore.__entries.get(PLAIN_REFRESH)).toBe('refresh-1');
    await expect(lockedSession.hasLockedSession()).resolves.toBe(false);
  });

  it('moves the session back to plain storage when the lock is turned off', async () => {
    const { SecureStore, lockedSession } = load('ios');
    await lockedSession.storeLockedSession('refresh-1');

    await lockedSession.storeUnlockedSession({ accessToken: null, refreshToken: 'refresh-1' });

    expect(SecureStore.__entries.get(PLAIN_REFRESH)).toBe('refresh-1');
    expect(SecureStore.__entries.has(PLAIN_ACCESS)).toBe(false);
    expect(SecureStore.__entries.has(LOCKED)).toBe(false);
    expect(SecureStore.__entries.has(MARKER)).toBe(false);
    const plainWrite = SecureStore.setItemAsync.mock.calls.find(
      ([key]) => key === 'sureground.refreshToken'
    );
    expect(plainWrite?.[2]).not.toHaveProperty('requireAuthentication');
  });
});

describe('reading the locked session', () => {
  it('returns the token after the biometric prompt', async () => {
    const { lockedSession } = load('ios');
    await lockedSession.storeLockedSession('refresh-1');
    await expect(lockedSession.readLockedRefreshToken()).resolves.toEqual({
      status: 'ok',
      refreshToken: 'refresh-1',
    });
  });

  it('treats an invalidated key (biometrics changed) as gone, so the person signs in again', async () => {
    const { SecureStore, lockedSession } = load('android');
    SecureStore.getItemAsync.mockResolvedValueOnce(null);
    await expect(lockedSession.readLockedRefreshToken()).resolves.toEqual({ status: 'gone' });
  });

  it('reports a dismissed prompt as cancelled', async () => {
    const { SecureStore, lockedSession } = load('android');
    SecureStore.getItemAsync.mockRejectedValueOnce(new Error('User canceled the authentication'));
    await expect(lockedSession.readLockedRefreshToken()).resolves.toEqual({ status: 'cancelled' });
  });

  it('reports any other prompt failure without throwing', async () => {
    const { SecureStore, lockedSession } = load('ios');
    SecureStore.getItemAsync.mockRejectedValueOnce(new Error('Biometry is locked out.'));
    await expect(lockedSession.readLockedRefreshToken()).resolves.toEqual({ status: 'failed' });
  });
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
