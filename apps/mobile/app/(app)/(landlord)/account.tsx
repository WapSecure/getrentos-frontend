import { Alert, Pressable, View } from 'react-native';
import { router } from 'expo-router';
import { ChevronRight, LogOut, ShieldCheck } from 'lucide-react-native';
import { Avatar, Card, Divider, Screen, Text, ThemeToggle, useTheme } from '@getrentos/ui-native';
import { useAuth } from '@/lib/auth/AuthProvider';
import { DashboardHeader } from '@/components/dashboard/DashboardHeader';

export default function LandlordAccount() {
  const { colors, spacing } = useTheme();
  const { profile, signOut } = useAuth();

  const confirmSignOut = () =>
    Alert.alert('Sign out?', 'You will need to sign in again to manage your properties.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign out', style: 'destructive', onPress: () => signOut() },
    ]);

  return (
    <Screen>
      <DashboardHeader
        eyebrow="Landlord workspace"
        title="Account"
        subtitle="Profile, preferences and property tools"
      />

      <Card padding={spacing.lg}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md }}>
          <Avatar name={profile?.legalName ?? 'Landlord'} size={52} />
          <View style={{ flex: 1, gap: 2 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
              <Text variant="bodyStrong" numberOfLines={1} style={{ flexShrink: 1 }}>
                {profile?.legalName ?? 'Landlord'}
              </Text>
              {profile?.isVerified ? <ShieldCheck size={14} color={colors.success} /> : null}
            </View>
            <Text variant="caption" color="mutedForeground" numberOfLines={1}>
              {profile?.email}
            </Text>
          </View>
        </View>
      </Card>

      <Card padding="none">
        <AccountRow
          label="Applications"
          description="Review and decide on applicants"
          onPress={() => router.push('/(app)/landlord-applications')}
        />
        <Divider />
        <AccountRow
          label="Leases"
          description="Drafts, signatures and renewals"
          onPress={() => router.push('/(app)/landlord-leases')}
        />
        <Divider />
        <AccountRow
          label="Maintenance"
          description="Open issues across your properties"
          onPress={() => router.push('/(app)/landlord-maintenance')}
        />
        <Divider />
        <AccountRow
          label="Payments"
          description="Rent collected, escrow and arrears"
          onPress={() => router.push('/(app)/landlord-payments')}
        />
        <Divider />
        <AccountRow
          label="Listings"
          description="What is live, paused or draft"
          onPress={() => router.push('/(app)/landlord-listings')}
        />
        <Divider />
        <AccountRow
          label="Leads"
          description="Enquiries to follow up"
          onPress={() => router.push('/(app)/landlord-leads')}
        />
        <Divider />
        <AccountRow
          label="Microsite"
          description="Your public page and its address"
          onPress={() => router.push('/(app)/landlord-microsite')}
        />
        <Divider />
        <AccountRow
          label="Financials"
          description="Profit, expenses and owner statements"
          onPress={() => router.push('/(app)/landlord-financials')}
        />
        <Divider />
        <AccountRow
          label="Documents"
          description="Leases, ownership papers, reports"
          onPress={() => router.push('/(app)/landlord-documents')}
        />
        <Divider />
        <AccountRow
          label="Reviews"
          description="What tenants say about you"
          onPress={() => router.push('/(app)/landlord-reviews')}
        />
        <Divider />
        <AccountRow
          label="Evictions"
          description="Notice, filing and resolution"
          onPress={() => router.push('/(app)/landlord-evictions')}
        />
        <Divider />
        <AccountRow
          label="Verify your identity"
          description="Required to publish listings"
          onPress={() => router.push('/(app)/verify-identity')}
        />
        <Divider />
        <AccountRow
          label="Referrals"
          description="Invite others, earn rewards"
          onPress={() => router.push('/(app)/referrals')}
        />
        <Divider />
        <AccountRow
          label="Shortlet stays"
          description="Browse and manage short stays"
          onPress={() => router.push('/(app)/shortlets')}
        />
        <Divider />
        <AccountRow
          label="Vendors"
          description="Tradespeople you assign to repairs"
          onPress={() => router.push('/(app)/landlord-vendors')}
        />
        <Divider />
        <AccountRow
          label="Settings"
          description="Profile, payout, automation, alerts"
          onPress={() => router.push('/(app)/landlord-settings')}
        />
        <Divider />
        <AccountRow
          label="Security"
          description="Password, phone verification, 2FA"
          onPress={() => router.push('/(app)/security-settings')}
        />
        <Divider />
        <AccountRow
          label="Help"
          description="FAQs and contact options"
          onPress={() => router.push('/(app)/help')}
        />
      </Card>

      <View style={{ gap: spacing.sm }}>
        <Text variant="label" color="mutedForeground" uppercase>
          Appearance
        </Text>
        <Card padding={spacing.lg}>
          <ThemeToggle />
        </Card>
      </View>

      <Pressable
        onPress={confirmSignOut}
        accessibilityRole="button"
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          gap: spacing.sm,
          paddingVertical: spacing.lg,
          borderRadius: 16,
          borderWidth: 1,
          borderColor: colors.border,
        }}
      >
        <LogOut size={17} color={colors.destructive} />
        <Text variant="callout" color="destructive" style={{ fontWeight: '600' }}>
          Sign out
        </Text>
      </Pressable>
    </Screen>
  );
}

function AccountRow({
  label,
  description,
  onPress,
}: {
  label: string;
  description: string;
  onPress: () => void;
}) {
  const { colors, spacing } = useTheme();
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.md,
        padding: spacing.lg,
      }}
    >
      <View style={{ flex: 1 }}>
        <Text variant="bodyStrong">{label}</Text>
        <Text variant="caption" color="mutedForeground">
          {description}
        </Text>
      </View>
      <ChevronRight size={18} color={colors.mutedForeground} />
    </Pressable>
  );
}
