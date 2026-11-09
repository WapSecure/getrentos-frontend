import { View } from 'react-native';
import { Building2 } from 'lucide-react-native';
import { Button, Screen, Text, useTheme } from '@sureground/ui-native';
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
  const label = PORTAL_LABEL[portal ?? ''] ?? 'This';

  // Admin is desktop-only by design, so point at the web rather than promise a mobile build.
  const isAdmin = portal === 'admin';

  return (
    <Screen>
      <View style={{ alignItems: 'center', gap: spacing.md, marginTop: spacing['6xl'] }}>
        <Building2 size={40} color={colors.mutedForeground} />
        <Text variant="title" center>
          {isAdmin ? `${label} runs on the web` : `${label} portal is coming to mobile`}
        </Text>
        <Text variant="body" color="mutedForeground" center style={{ maxWidth: 320 }}>
          {isAdmin
            ? 'Trust reviews, staff approvals and the fraud queue live in the backoffice. Sign in there on a desktop at getsureground.io.'
            : 'Your portal is being built next: use the web app at getsureground.io in the meantime.'}
        </Text>
        <Button
          label="Sign out"
          variant="outline"
          onPress={signOut}
          style={{ marginTop: spacing.lg }}
        />
      </View>
    </Screen>
  );
}
