/**
 * jest-expo installs Expo's "winter" runtime before every test file, which makes
 * `globalThis.fetch` a lazy getter. The first read loads Expo's native fetch
 * module, and in Node that logs a warning about the missing native JS logger.
 *
 * When nothing in a file touches `fetch`, that first read can happen while Jest
 * tears the environment down. Jest then reports "Cannot log after tests are done"
 * and sets the process exit code to 1, so CI fails a run where every test passed.
 *
 * Swap the getter for Node's own fetch, which Expo keeps as `originalFetch`.
 * Tests mock their API calls, so none depend on Expo's implementation.
 */
const descriptor = Object.getOwnPropertyDescriptor(globalThis, 'fetch');
if (descriptor && descriptor.get && typeof globalThis.originalFetch === 'function') {
  Object.defineProperty(globalThis, 'fetch', {
    value: globalThis.originalFetch,
    writable: true,
    configurable: true,
    enumerable: descriptor.enumerable,
  });
}
