import { redirect } from 'next/navigation';

export default function Page() {
  redirect('/landlord/financials?tab=statements');
}
