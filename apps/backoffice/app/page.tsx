import { redirect } from 'next/navigation';
import { ROUTES } from '@getrentos/shared';

export default function RootPage() {
  redirect(ROUTES.ADMIN_DASHBOARD);
}
