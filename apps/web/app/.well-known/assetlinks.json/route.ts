import { appLinkEnv, assetLinks } from '@/lib/appLinks';

/** Lets the Android app open links to this site (Digital Asset Links). */
export function GET() {
  const body = assetLinks(appLinkEnv());
  if (!body) return new Response('Not found', { status: 404 });
  return Response.json(body, { headers: { 'Cache-Control': 'public, max-age=3600' } });
}
