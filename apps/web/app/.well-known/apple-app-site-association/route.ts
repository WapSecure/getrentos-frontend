import { appleAppSiteAssociation, appLinkEnv } from '@/lib/appLinks';

// Served without a file extension, as Apple requires.
export function GET() {
  const body = appleAppSiteAssociation(appLinkEnv());
  if (!body) return new Response('Not found', { status: 404 });
  return Response.json(body, { headers: { 'Cache-Control': 'public, max-age=3600' } });
}
