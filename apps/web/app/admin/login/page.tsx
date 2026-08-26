import { redirect } from 'next/navigation';

const backofficeUrl = process.env.NEXT_PUBLIC_BACKOFFICE_URL || 'http://localhost:3001';

/**
 * The staff console is hosted by the Backoffice app, not the customer web app.
 * Keep this familiar entry URL working instead of presenting a misleading 404.
 */
export default function AdminLoginRedirectPage() {
  redirect(`${backofficeUrl}/admin/login`);
}
