import { redirect } from 'next/navigation';

const backofficeUrl = process.env.NEXT_PUBLIC_BACKOFFICE_URL || 'http://localhost:3001';

/**
 * Staff pages live in the Backoffice app. A staff member who signs in here is
 * routed to /admin/dashboard (and old links may point at other /admin pages):
 * send them to the same page in the staff console instead of a 404.
 */
export default async function AdminConsoleRedirectPage({
  params,
}: {
  params: Promise<{ path: string[] }>;
}) {
  const { path } = await params;
  redirect(`${backofficeUrl}/admin/${path.map(encodeURIComponent).join('/')}`);
}
