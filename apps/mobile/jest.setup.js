// Expo's lazy fetch getter, read after teardown, fails a passing Jest run ("Cannot log after tests are done").
// Tests mock fetch themselves; an unmocked call fails loudly.
Object.defineProperty(globalThis, 'fetch', {
  configurable: true,
  writable: true,
  value: () => Promise.reject(new Error('fetch is not mocked in this test')),
});
