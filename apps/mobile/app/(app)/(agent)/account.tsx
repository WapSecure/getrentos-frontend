import { Pressable, View } from 'react-native';
import { router } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import {
  BadgeCheck,
  Building2,
  ChevronRight,
  CircleHelp,
  ClipboardCheck,
  FileStack,
  LogOut,
  RefreshCw,
  ShieldCheck,
  Star,
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
import { agentApi } from '@/lib/api/agent';
import { useAuth } from '@/lib/auth/AuthProvider';

export default function AgentAccount() {
  const { signOut } = useAuth();
  const { colors, spacing } = useTheme();

  const query = useQuery({ queryKey: qk.agent.profile, queryFn: agentApi.profile });

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
            <Text variant="heading">{query.data?.legalName ?? 'GetRentos agent'}</Text>
            <Text variant="callout" color="mutedForeground">
              {query.data?.email}
            </Text>
            {query.data?.isVerified ? (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                <ShieldCheck size={14} color={colors.success} />
                <Text variant="caption" style={{ color: colors.success }}>
                  Verified · Trust score {query.data.trustScore}
                </Text>
              </View>
            ) : null}
            {query.data && query.data.reviewCount > 0 ? (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                <Star size={13} color={colors.warning} fill={colors.warning} />
                <Text variant="caption" color="mutedForeground">
                  {query.data.reviewAverage.toFixed(1)} ({query.data.reviewCount} reviews) ·{' '}
                  {query.data.completedTasks} tasks completed
                </Text>
              </View>
            ) : null}
          </>
        )}
      </View>

      <Card elevated padding="none">
        <Row
          icon={<Building2 size={18} color={colors.primary} />}
          label="My properties"
          description="Properties assigned to you"
          onPress={() => router.push('/(app)/agent-properties')}
        />
        <Divider />
        <Row
          icon={<FileStack size={18} color={colors.primary} />}
          label="Documents"
          description="Inspection reports, forms, IDs"
          onPress={() => router.push('/(app)/agent-documents')}
        />
        <Divider />
        <Row
          icon={<Star size={18} color={colors.primary} />}
          label="Reviews"
          description="Ratings from your clients"
          onPress={() => router.push('/(app)/agent-reviews')}
        />
        <Divider />
        <Row
          icon={<ShieldCheck size={18} color={colors.primary} />}
          label="Trust & verification"
          description="Your trust score and badges"
          onPress={() => router.push('/(app)/agent-trust-profile')}
        />
        <Divider />
        <Row
          icon={<ClipboardCheck size={18} color={colors.primary} />}
          label="Inspections"
          description="Reports you've recorded"
          onPress={() => router.push('/(app)/agent-inspections')}
        />
        <Divider />
        <Row
          icon={<BadgeCheck size={18} color={colors.primary} />}
          label="Verifications"
          description="Verification visits you've submitted"
          onPress={() => router.push('/(app)/agent-verifications')}
        />
        <Divider />
        <Row
          icon={<ShieldCheck size={18} color={colors.primary} />}
          label="Identity verification"
          description="Verify your ID and licence"
          onPress={() => router.push('/(app)/verify-identity')}
        />
        <Divider />
        <Row
          icon={<RefreshCw size={18} color={colors.primary} />}
          label="Sync status"
          description="Field records and their sync state"
          onPress={() => router.push('/(app)/agent-sync')}
        />
        <Divider />
        <Row
          icon={<CircleHelp size={18} color={colors.primary} />}
          label="Help"
          description="FAQs and contact support"
          onPress={() => router.push('/(app)/help?messages=/(app)/(agent)/messages')}
        />
        <Divider />
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
