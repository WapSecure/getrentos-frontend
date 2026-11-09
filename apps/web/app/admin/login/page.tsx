import { redirect } from 'next/navigation';

const backofficeUrl = process.env.NEXT_PUBLIC_BACKOFFICE_URL || 'http://localhost:3001';

export default function AdminLoginRedirectPage() {
  redirect(`${backofficeUrl}/admin/login`);
}
