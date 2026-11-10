// Node's type stripping needs file extensions; the source imports without them, as the bundlers expect.
export async function resolve(specifier, context, next) {
  try {
    return await next(specifier, context);
  } catch (error) {
    if (specifier.startsWith('.') && !/\.[cm]?[jt]s$/.test(specifier))
      return next(`${specifier}.ts`, context);
    throw error;
  }
}
