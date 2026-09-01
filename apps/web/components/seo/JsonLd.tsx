/**
 * Renders a JSON-LD structured-data script.
 * Server Component only — no client JS is shipped for the script itself.
 *
 * Usage: <JsonLd data={organizationJsonLd} />
 */
export function JsonLd({ data }: { data: Record<string, unknown> }) {
  return (
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }} />
  );
}
