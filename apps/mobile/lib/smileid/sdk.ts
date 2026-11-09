export type SmileSdk = typeof import('@smileid/usesmileid');

// Metro bundles every `require()` it sees, so the SDK may only be referenced from sdk.native.ts or the web build fails.
export function loadSmileSdk(): SmileSdk | null {
  return null;
}
