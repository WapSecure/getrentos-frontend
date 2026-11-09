/** Expo's lazy `fetch` getter can load its native module during teardown, which fails a passing Jest run; swap in Node's `originalFetch`. */
const descriptor = Object.getOwnPropertyDescriptor(globalThis, 'fetch');
if (descriptor && descriptor.get && typeof globalThis.originalFetch === 'function') {
  Object.defineProperty(globalThis, 'fetch', {
    value: globalThis.originalFetch,
    writable: true,
    configurable: true,
    enumerable: descriptor.enumerable,
  });
}
