// Node's type stripping needs file extensions; the source imports without them, as the bundlers
// expect. A folder import ("./types") resolves to its index.ts.
export async function resolve(specifier, context, next) {
  try {
    return await next(specifier, context);
  } catch (error) {
    if (!specifier.startsWith('.') || /\.[cm]?[jt]s$/.test(specifier)) throw error;
    try {
      return await next(`${specifier}.ts`, context);
    } catch {
      return next(`${specifier}/index.ts`, context);
    }
  }
}
