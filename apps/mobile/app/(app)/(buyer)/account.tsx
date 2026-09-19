import { Pressable, View } from 'react-native';
import { router } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import {
  BadgeCheck,
  BedDouble,
  Bell,
  Calendar,
  ChevronRight,
  CircleHelp,
  CreditCard,
  FileStack,
  Heart,
  LandPlot,
  LogOut,
  Search,
  ShieldCheck,
  Star,
  User,
  Wallet,
} from 'lucide-react-native';
import {
  Avatar,
  Button,
  Card,
  Divider,
  Screen,
  Skeleton,
  Text,
  ThemeToggle,
  useTheme,
} from '@getrentos/ui-native';
import { qk } from '@/lib/query/keys';
import { buyerApi } from '@/lib/api/buyer';
import { useAuth } from '@/lib/auth/AuthProvider';

export default function BuyerAccount() {
  const { signOut } = useAuth();
  const { colors, spacing } = useTheme();

  const query = useQuery({ queryKey: qk.buyer.profile, queryFn: buyerApi.profile });

  return (
    <Screen>
      <View style={{ alignItems: 'center', gap: spacing.sm, marginTop: spacing.xl }}>
        {query.isLoading ? (
          <>
            <Skeleton height={72} width={72} radius={36} />
            <Skeleton height={20} width={160} />
          </>
        ) : (
          <>
            <Avatar name={query.data?.legalName} size={72} />
            <Text variant="heading">{query.data?.legalName ?? 'GetRentos buyer'}</Text>
            <Text variant="callout" color="mutedForeground">
              {query.data?.email}
            </Text>
            {query.data ? (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                <ShieldCheck size={14} color={colors.success} />
                <Text variant="caption" style={{ color: colors.success }}>
                  {query.data.verificationStatus} · Trust score {query.data.trustScore}
                </Text>
              </View>
            ) : null}
          </>
        )}
      </View>

      <Card elevated padding="none">
        <Row
          icon={<User size={18} color={colors.primary} />}
          label="Profile"
          description="Your name and contact details"
          onPress={() => router.push('/(app)/buyer-profile')}
        />
        <Divider />
        <Row
          icon={<BadgeCheck size={18} color={colors.primary} />}
          label="Identity verification"
          description="Verify your ID to unlock offers"
          onPress={() => router.push('/(app)/verify-identity')}
        />
        <Divider />
        <Row
          icon={<LandPlot size={18} color={colors.primary} />}
          label="Land"
          description="Browse verified land parcels"
          onPress={() => router.push('/(app)/land')}
        />
        <Divider />
        <Row
          icon={<BedDouble size={18} color={colors.primary} />}
          label="Shortlet stays"
          description="Book short stays and manage trips"
          onPress={() => router.push('/(app)/shortlets')}
        />
        <Divider />
        <Row
          icon={<Heart size={18} color={colors.primary} />}
          label="Saved listings"
          description="Properties you're tracking"
          onPress={() => router.push('/(app)/buyer-saved')}
        />
        <Divider />
        <Row
          icon={<Calendar size={18} color={colors.primary} />}
          label="Viewings"
          description="Requested and upcoming viewings"
          onPress={() => router.push('/(app)/buyer-viewings')}
        />
        <Divider />
        <Row
          icon={<Wallet size={18} color={colors.primary} />}
          label="Transactions"
          description="Escrow and closing progress"
          onPress={() => router.push('/(app)/buyer-transactions')}
        />
        <Divider />
        <Row
          icon={<FileStack size={18} color={colors.primary} />}
          label="Documents"
          description="Proof of funds, preapprovals, title"
          onPress={() => router.push('/(app)/buyer-documents')}
        />
        <Divider />
        <Row
          icon={<Star size={18} color={colors.primary} />}
          label="Reviews"
          description="Reviews you've left"
          onPress={() => router.push('/(app)/buyer-reviews')}
        />
        <Divider />
        <Row
          icon={<ShieldCheck size={18} color={colors.primary} />}
          label="Trust & verification"
          description="Your trust score and badges"
          onPress={() => router.push('/(app)/buyer-trust-profile')}
        />
      </Card>

      <Card elevated padding="none">
        <Row
          icon={<CreditCard size={18} color={colors.primary} />}
          label="Payment method"
          description="Bank details for deposits"
          onPress={() => router.push('/(app)/buyer-payment-method')}
        />
        <Divider />
        <Row
          icon={<Search size={18} color={colors.primary} />}
          label="Search preferences"
          description="Budget, type and location filters"
          onPress={() => router.push('/(app)/buyer-search-preferences')}
        />
        <Divider />
        <Row
          icon={<Bell size={18} color={colors.primary} />}
          label="Notifications"
          description="Alerts for offers, escrow and viewings"
          onPress={() => router.push('/(app)/buyer-notifications')}
        />
        <Divider />
        <Row
          icon={<CircleHelp size={18} color={colors.primary} />}
          label="Help"
          description="FAQs and contact support"
          onPress={() => router.push('/(app)/help?messages=/(app)/(buyer)/messages')}
        />
      </Card>

      <Card elevated padding="none">
        <View style={{ padding: spacing.lg, gap: spacing.xs }}>
          <Text variant="bodyStrong">Appearance</Text>
          <Text variant="caption" color="mutedForeground">
            Choose how GetRentos looks on this device.
          </Text>
        </View>
        <Divider />
        <View style={{ padding: spacing.md }}>
          <ThemeToggle variant="segmented" />
        </View>
      </Card>

      <Button
        label="Sign out"
        variant="outline"
        fullWidth
        icon={<LogOut size={16} color={colors.foreground} />}
        onPress={signOut}
      />
    </Screen>
  );
}

function Row({
  icon,
  label,
  description,
  onPress,
}: {
  icon: React.ReactNode;
  label: string;
  description: string;
  onPress: () => void;
}) {
  const { colors, spacing } = useTheme();
  return (
    <Pressable
      onPress={onPress}
      style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md, padding: spacing.lg }}
    >
      {icon}
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
