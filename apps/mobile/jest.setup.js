// Expo installs `fetch` as a lazy getter that loads its native fetch module on
// first read. Jest has no native modules, so that load logs a warning, and when
// the read comes after a test file has been torn down (a library walking the
// globals, a stray timer) Jest reports "Cannot log after tests are done" and
// fails the whole run even though every test passed.
//
// Tests that need fetch mock it (`jest.spyOn(globalThis, 'fetch')` or assign
// `globalThis.fetch`); an unmocked call fails loudly instead of going anywhere.
Object.defineProperty(globalThis, 'fetch', {
  configurable: true,
  writable: true,
  value: () => Promise.reject(new Error('fetch is not mocked in this test')),
});
