import { redirect } from 'next/navigation';

const backofficeUrl = process.env.NEXT_PUBLIC_BACKOFFICE_URL || 'http://localhost:3001';

/** Alias for the common sign-in spelling used in bookmarks and shared links. */
export default function AdminSignInRedirectPage() {
  redirect(`${backofficeUrl}/admin/login`);
}
