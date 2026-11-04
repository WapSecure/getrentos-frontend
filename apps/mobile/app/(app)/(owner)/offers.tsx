import { DashboardHeader } from '@/components/dashboard/DashboardHeader';
import { SellerOffers } from '@/components/offers/SellerOffers';

export default function OwnerOffers() {
  return (
    <SellerOffers
      side="owner"
      header={
        <DashboardHeader eyebrow="Selling" title="Offers" subtitle="What buyers are offering" />
      }
    />
  );
}
