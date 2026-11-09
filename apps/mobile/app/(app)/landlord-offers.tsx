import { View } from 'react-native';
import { useTheme } from '@sureground/ui-native';
import { DetailScreenHeader } from '@/components/dashboard/DetailScreenHeader';
import { SellerOffers } from '@/components/offers/SellerOffers';
import { goBack } from '@/lib/goBack';

export default function LandlordOffers() {
  const { colors } = useTheme();
  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <DetailScreenHeader
        eyebrow="Selling"
        title="Offers"
        subtitle="What buyers are offering"
        onBack={() => goBack()}
      />
      <SellerOffers side="landlord" header={null} topInset={false} />
    </View>
  );
}
