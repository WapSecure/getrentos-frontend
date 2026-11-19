import AsyncStorage from '@react-native-async-storage/async-storage';
import { clearSecureLeftoversOnFreshInstall } from '@/lib/auth/freshInstall';
import { secureStorage } from '@/lib/storage';

jest.mock('@/lib/storage', () => {
  const store = new Map<string, string>();
  return {
    secureStorage: {
      get: jest.fn(async (key: string) => store.get(key) ?? null),
      set: jest.fn(async (key: string, value: string) => void store.set(key, value)),
      remove: jest.fn(async (key: string) => void store.delete(key)),
      __store: store,
    },
  };
});

const store = (secureStorage as unknown as { __store: Map<string, string> }).__store;
const KEYS = [
  'sureground.accessToken',
  'sureground.refreshToken',
  'sureground.initialRolesPending',
];

describe('clearSecureLeftoversOnFreshInstall', () => {
  beforeEach(async () => {
    await AsyncStorage.clear();
    store.clear();
    store.set('sureground.accessToken', 'old-access');
    store.set('sureground.refreshToken', 'old-refresh');
    store.set('sureground.initialRolesPending', 'user-1');
    store.set('getrentos.refreshToken', 'legacy-refresh');
  });

  it('wipes Keychain leftovers on the first launch after an install, then sets the marker', async () => {
    await clearSecureLeftoversOnFreshInstall(KEYS);
    expect(store.size).toBe(0);
    expect(await AsyncStorage.getItem('sureground.installed')).toBe('1');
  });

  it('leaves the session alone once the marker is set', async () => {
    await AsyncStorage.setItem('sureground.installed', '1');
    await clearSecureLeftoversOnFreshInstall(KEYS);
    expect(store.get('sureground.accessToken')).toBe('old-access');
    expect(store.get('sureground.refreshToken')).toBe('old-refresh');
  });

  it('keeps an existing install from before the marker signed in and marks it', async () => {
    await AsyncStorage.setItem('sureground.profile', '{"id":"user-1"}');
    await clearSecureLeftoversOnFreshInstall(KEYS);
    expect(store.get('sureground.refreshToken')).toBe('old-refresh');
    expect(await AsyncStorage.getItem('sureground.installed')).toBe('1');
  });

  it('lets a sign-in after the first launch persist and survive the next launch', async () => {
    await clearSecureLeftoversOnFreshInstall(KEYS);
    await secureStorage.set('sureground.accessToken', 'new-access');
    await secureStorage.set('sureground.refreshToken', 'new-refresh');
    await clearSecureLeftoversOnFreshInstall(KEYS);
    expect(await secureStorage.get('sureground.accessToken')).toBe('new-access');
    expect(await secureStorage.get('sureground.refreshToken')).toBe('new-refresh');
  });
});
