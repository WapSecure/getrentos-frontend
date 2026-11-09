import AsyncStorage from '@react-native-async-storage/async-storage';

// jest.mock is hoisted above imports, so the documented mock has to be required inline.
jest.mock('@react-native-async-storage/async-storage', () =>
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

/** Loads the module fresh, so its start-up migration runs against this test's storage. */
async function loadMigration() {
  let migration: Promise<void> | undefined;
  jest.isolateModules(() => {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    migration = require('@/lib/legacyStorage').legacyStorageMigration;
  });
  await migration;
}

describe('legacy storage migration (GetRentos → Sureground)', () => {
  beforeEach(async () => {
    await AsyncStorage.clear();
  });

  it('moves every getrentos key to its sureground name, keeping the value', async () => {
    await AsyncStorage.multiSet([
      ['getrentos.gate.offline-queue', '[{"id":"q1"}]'],
      ['getrentos.onboardingSeen', 'true'],
      ['unrelated', 'x'],
    ]);
    await loadMigration();
    expect(await AsyncStorage.getItem('sureground.gate.offline-queue')).toBe('[{"id":"q1"}]');
    expect(await AsyncStorage.getItem('sureground.onboardingSeen')).toBe('true');
    expect(await AsyncStorage.getItem('getrentos.gate.offline-queue')).toBeNull();
    expect(await AsyncStorage.getItem('unrelated')).toBe('x');
  });

  it('keeps a value already saved under the new key', async () => {
    await AsyncStorage.multiSet([
      ['getrentos.themePreference', 'dark'],
      ['sureground.themePreference', 'light'],
    ]);
    await loadMigration();
    expect(await AsyncStorage.getItem('sureground.themePreference')).toBe('light');
    expect(await AsyncStorage.getItem('getrentos.themePreference')).toBeNull();
  });
});
