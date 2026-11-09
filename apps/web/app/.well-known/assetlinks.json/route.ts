import { appLinkEnv, assetLinks } from '@/lib/appLinks';

export function GET() {
  const body = assetLinks(appLinkEnv());
  if (!body) return new Response('Not found', { status: 404 });
  return Response.json(body, { headers: { 'Cache-Control': 'public, max-age=3600' } });
}
