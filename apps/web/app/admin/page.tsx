import { redirect } from 'next/navigation';

const backofficeUrl = process.env.NEXT_PUBLIC_BACKOFFICE_URL || 'http://localhost:3001';

/** Route the top-level admin entry point to the dedicated staff console. */
export default function AdminRedirectPage() {
  redirect(`${backofficeUrl}/admin/login`);
}
