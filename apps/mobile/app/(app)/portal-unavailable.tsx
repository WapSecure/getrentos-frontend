import { View } from 'react-native';
import { Building2 } from 'lucide-react-native';
import { Button, Screen, Text, useTheme } from '@getrentos/ui-native';
import { useAuth } from '@/lib/auth/AuthProvider';

const PORTAL_LABEL: Record<string, string> = {
  landlord: 'Landlord',
  owner: 'Property owner',
  buyer: 'Buyer',
  realtor: 'Realtor',
  agent: 'Agent',
  estate: 'Estate manager',
  gateman: 'Gate',
  resident: 'Resident',
  admin: 'Admin',
};

export default function PortalUnavailable() {
  const { portal, signOut } = useAuth();
  const { colors, spacing } = useTheme();

  return (
    <Screen>
      <View style={{ alignItems: 'center', gap: spacing.md, marginTop: spacing['6xl'] }}>
        <Building2 size={40} color={colors.mutedForeground} />
        <Text variant="title" center>
          {PORTAL_LABEL[portal ?? ''] ?? 'This'} portal is coming to mobile
        </Text>
        <Text variant="body" color="mutedForeground" center style={{ maxWidth: 320 }}>
          The renter experience is live now. Your portal is being built next — use the web app at
          getrentos.com in the meantime.
        </Text>
        <Button label="Sign out" variant="outline" onPress={signOut} style={{ marginTop: spacing.lg }} />
      </View>
    </Screen>
  );
}
