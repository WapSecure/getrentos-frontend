import { redirect } from 'next/navigation';
import { ROUTES } from '@sureground/shared';

export default function RootPage() {
  redirect(ROUTES.ADMIN_DASHBOARD);
}
