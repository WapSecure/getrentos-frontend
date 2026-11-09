/** Smile ID's SDK type, for the native loader and the components that use it. */
export type SmileSdk = typeof import('@smileid/usesmileid');

/**
 * Web and tests: no Smile ID. Metro bundles every `require()` it can see, so
 * the SDK may only be referenced from `sdk.native.ts`; otherwise the web
 * bundle pulls in native-only code and fails to build.
 */
export function loadSmileSdk(): SmileSdk | null {
  return null;
}
