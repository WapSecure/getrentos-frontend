/* global jest */
// Expo's lazy fetch getter, read after teardown, fails a passing Jest run ("Cannot log after tests are done").
// Tests mock fetch themselves; an unmocked call fails loudly.
Object.defineProperty(globalThis, 'fetch', {
  configurable: true,
  writable: true,
  value: () => Promise.reject(new Error('fetch is not mocked in this test')),
});

// The API client reads the install id from AsyncStorage on every request; tests that need specific storage behaviour still mock it themselves.
jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

// Reanimated and worklets need native runtimes Jest does not have; component tests render through a plain-React stand-in.
jest.mock(
  'react-native-reanimated',
  () => require('./__tests__/helpers/reanimated-mock').reanimated
);
jest.mock('react-native-worklets', () => require('./__tests__/helpers/reanimated-mock').worklets);

// Insets of zero without a provider, so screens and the toast host render in isolation.
jest.mock(
  'react-native-safe-area-context',
  () => require('react-native-safe-area-context/jest/mock').default
);
