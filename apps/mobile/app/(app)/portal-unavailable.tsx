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
  const label = PORTAL_LABEL[portal ?? ''] ?? 'This';

  // Admin is not "coming later" — the backoffice is a desktop console by
  // design, so promising a mobile build here would be a lie. It points at the
  // web instead.
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
            ? 'Trust reviews, staff approvals and the fraud queue live in the backoffice. Sign in there on a desktop at getrentos.com.'
            : 'Your portal is being built next — use the web app at getrentos.com in the meantime.'}
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
