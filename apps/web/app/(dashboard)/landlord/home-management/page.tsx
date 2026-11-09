import { redirect } from 'next/navigation';

export default function Page() {
  redirect('/landlord/maintenance?tab=home-management');
}
