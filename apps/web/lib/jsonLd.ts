const UNSAFE = /[<>&\u2028\u2029]/g;
const ESCAPES: Record<string, string> = {
  '<': '\\u003c',
  '>': '\\u003e',
  '&': '\\u0026',
  '\u2028': '\\u2028',
  '\u2029': '\\u2029',
};

// Listing titles and descriptions are user content; escaping stops a `</script>` from closing the tag.
export function serializeJsonLd(data: unknown): string {
  return JSON.stringify(data).replace(UNSAFE, (c) => ESCAPES[c]);
}
