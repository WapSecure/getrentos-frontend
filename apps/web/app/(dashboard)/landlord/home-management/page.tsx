import { redirect } from 'next/navigation';

/** Folded into a tab of a hub page; the old URL still lands in the right place. */
export default function Page() {
  redirect('/landlord/maintenance?tab=home-management');
}
