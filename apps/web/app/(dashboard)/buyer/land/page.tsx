import { LandMarketplaceBrowser } from '@/components/land/LandMarketplaceBrowser';
import { BuyerLandSummaryBanner } from '@/components/land/buyer/BuyerLandSummaryBanner';

export default function BuyerLandPage() {
  return (
    <>
      <BuyerLandSummaryBanner />
      <LandMarketplaceBrowser mode="buyer" />
    </>
  );
}
