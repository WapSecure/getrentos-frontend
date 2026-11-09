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
