import { Pressable, View } from 'react-native';
import { router } from 'expo-router';
import {
  BedDouble,
  Bell,
  Calendar,
  CheckSquare,
  ChevronRight,
  CircleHelp,
  ClipboardCheck,
  FileStack,
  FileText,
  Gift,
  LandPlot,
  LifeBuoy,
  LogOut,
  ShieldCheck,
  ShieldEllipsis,
  Sparkles,
  TrendingUp,
  UserRound,
  Users,
  Wallet,
  Wrench,
} from 'lucide-react-native';
import {
  Avatar,
  Button,
  Card,
  Divider,
  Screen,
  Text,
  ThemeToggle,
  useTheme,
} from '@getrentos/ui-native';
import { useAuth } from '@/lib/auth/AuthProvider';

export default function Account() {
  const { profile, signOut } = useAuth();
  const { colors, spacing } = useTheme();

  return (
    <Screen>
      <View style={{ alignItems: 'center', gap: spacing.sm, marginTop: spacing.xl }}>
        <Avatar name={profile?.legalName} size={72} />
        <Text variant="heading">{profile?.legalName ?? 'GetRentos user'}</Text>
        <Text variant="callout" color="mutedForeground">
          {profile?.email ?? profile?.phone ?? ''}
        </Text>
        {profile?.isVerified ? (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
            <ShieldCheck size={14} color={colors.success} />
            <Text variant="caption" style={{ color: colors.success }}>
              Verified account · Trust score {profile.trustScore}
            </Text>
          </View>
        ) : null}
      </View>

      <Card elevated padding="none">
        <Pressable
          onPress={() => router.push('/(app)/verify-identity')}
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: spacing.md,
            padding: spacing.lg,
          }}
        >
          <ShieldCheck size={18} color={colors.primary} />
          <View style={{ flex: 1 }}>
            <Text variant="bodyStrong">Identity verification</Text>
            <Text variant="caption" color="mutedForeground">
              {profile?.isVerified ? 'Verified' : 'Required for applications and offers'}
            </Text>
          </View>
          <ChevronRight size={18} color={colors.mutedForeground} />
        </Pressable>
        <Divider />
        <Pressable
          onPress={() => router.push('/(app)/trust-score')}
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: spacing.md,
            padding: spacing.lg,
          }}
        >
          <Sparkles size={18} color={colors.primary} />
          <View style={{ flex: 1 }}>
            <Text variant="bodyStrong">Trust score</Text>
            <Text variant="caption" color="mutedForeground">
              {profile?.trustScore != null
                ? `${profile.trustScore} / 100`
                : 'How landlords see you'}
            </Text>
          </View>
          <ChevronRight size={18} color={colors.mutedForeground} />
        </Pressable>
        <Divider />
        <Pressable
          onPress={() => router.push('/(app)/lease')}
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: spacing.md,
            padding: spacing.lg,
          }}
        >
          <FileText size={18} color={colors.primary} />
          <View style={{ flex: 1 }}>
            <Text variant="bodyStrong">Lease &amp; payments</Text>
            <Text variant="caption" color="mutedForeground">
              View your lease, pay rent, download receipts
            </Text>
          </View>
          <ChevronRight size={18} color={colors.mutedForeground} />
        </Pressable>
        <Divider />
        <Pressable
          onPress={() => router.push('/(app)/financing')}
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: spacing.md,
            padding: spacing.lg,
          }}
        >
          <Wallet size={18} color={colors.primary} />
          <View style={{ flex: 1 }}>
            <Text variant="bodyStrong">GetRentos Flex</Text>
            <Text variant="caption" color="mutedForeground">
              Split your rent into monthly payments
            </Text>
          </View>
          <ChevronRight size={18} color={colors.mutedForeground} />
        </Pressable>
        <Divider />
        <Pressable
          onPress={() => router.push('/(app)/inspections')}
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: spacing.md,
            padding: spacing.lg,
          }}
        >
          <ClipboardCheck size={18} color={colors.primary} />
          <View style={{ flex: 1 }}>
            <Text variant="bodyStrong">Inspection reports</Text>
            <Text variant="caption" color="mutedForeground">
              Move-in, move-out and periodic reports
            </Text>
          </View>
          <ChevronRight size={18} color={colors.mutedForeground} />
        </Pressable>
        <Divider />
        <Pressable
          onPress={() => router.push('/(app)/credit-reporting')}
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: spacing.md,
            padding: spacing.lg,
          }}
        >
          <TrendingUp size={18} color={colors.primary} />
          <View style={{ flex: 1 }}>
            <Text variant="bodyStrong">Credit reporting</Text>
            <Text variant="caption" color="mutedForeground">
              Turn on-time rent into credit history
            </Text>
          </View>
          <ChevronRight size={18} color={colors.mutedForeground} />
        </Pressable>
        <Divider />
        <Pressable
          onPress={() => router.push('/(app)/maintenance')}
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: spacing.md,
            padding: spacing.lg,
          }}
        >
          <Wrench size={18} color={colors.primary} />
          <View style={{ flex: 1 }}>
            <Text variant="bodyStrong">Maintenance</Text>
            <Text variant="caption" color="mutedForeground">
              Report an issue, track repairs
            </Text>
          </View>
          <ChevronRight size={18} color={colors.mutedForeground} />
        </Pressable>
        <Divider />
        <Pressable
          onPress={() => router.push('/(app)/documents')}
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: spacing.md,
            padding: spacing.lg,
          }}
        >
          <FileStack size={18} color={colors.primary} />
          <View style={{ flex: 1 }}>
            <Text variant="bodyStrong">Documents</Text>
            <Text variant="caption" color="mutedForeground">
              Your leases, receipts and paperwork
            </Text>
          </View>
          <ChevronRight size={18} color={colors.mutedForeground} />
        </Pressable>
        <Divider />
        <Pressable
          onPress={() => router.push('/(app)/roommates')}
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: spacing.md,
            padding: spacing.lg,
          }}
        >
          <Users size={18} color={colors.primary} />
          <View style={{ flex: 1 }}>
            <Text variant="bodyStrong">Roommates</Text>
            <Text variant="caption" color="mutedForeground">
              Split rent and shared expenses
            </Text>
          </View>
          <ChevronRight size={18} color={colors.mutedForeground} />
        </Pressable>
        <Divider />
        <Pressable
          onPress={() => router.push('/(app)/edit-profile')}
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: spacing.md,
            padding: spacing.lg,
          }}
        >
          <UserRound size={18} color={colors.primary} />
          <View style={{ flex: 1 }}>
            <Text variant="bodyStrong">Edit profile</Text>
            <Text variant="caption" color="mutedForeground">
              Name, contact details, photo
            </Text>
          </View>
          <ChevronRight size={18} color={colors.mutedForeground} />
        </Pressable>
        <Divider />
        <Pressable
          onPress={() => router.push('/(app)/notification-settings')}
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: spacing.md,
            padding: spacing.lg,
          }}
        >
          <Bell size={18} color={colors.primary} />
          <View style={{ flex: 1 }}>
            <Text variant="bodyStrong">Notifications</Text>
            <Text variant="caption" color="mutedForeground">
              Email, push and in-app preferences
            </Text>
          </View>
          <ChevronRight size={18} color={colors.mutedForeground} />
        </Pressable>
        <Divider />
        <Pressable
          onPress={() => router.push('/(app)/security-settings')}
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: spacing.md,
            padding: spacing.lg,
          }}
        >
          <ShieldEllipsis size={18} color={colors.primary} />
          <View style={{ flex: 1 }}>
            <Text variant="bodyStrong">Security</Text>
            <Text variant="caption" color="mutedForeground">
              Password, phone verification, 2FA
            </Text>
          </View>
          <ChevronRight size={18} color={colors.mutedForeground} />
        </Pressable>
        <Divider />
        <Pressable
          onPress={() => router.push('/(app)/move-checklist')}
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: spacing.md,
            padding: spacing.lg,
          }}
        >
          <CheckSquare size={18} color={colors.primary} />
          <View style={{ flex: 1 }}>
            <Text variant="bodyStrong">Move checklist</Text>
            <Text variant="caption" color="mutedForeground">
              Move-in and move-out to-dos
            </Text>
          </View>
          <ChevronRight size={18} color={colors.mutedForeground} />
        </Pressable>
        <Divider />
        <Pressable
          onPress={() => router.push('/(app)/calendar')}
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: spacing.md,
            padding: spacing.lg,
          }}
        >
          <Calendar size={18} color={colors.primary} />
          <View style={{ flex: 1 }}>
            <Text variant="bodyStrong">Calendar</Text>
            <Text variant="caption" color="mutedForeground">
              Viewings, payments and lease dates
            </Text>
          </View>
          <ChevronRight size={18} color={colors.mutedForeground} />
        </Pressable>
        <Divider />
        <Pressable
          onPress={() => router.push('/(app)/referrals')}
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: spacing.md,
            padding: spacing.lg,
          }}
        >
          <Gift size={18} color={colors.primary} />
          <View style={{ flex: 1 }}>
            <Text variant="bodyStrong">Referrals</Text>
            <Text variant="caption" color="mutedForeground">
              Invite friends, earn rewards
            </Text>
          </View>
          <ChevronRight size={18} color={colors.mutedForeground} />
        </Pressable>
        <Divider />
        <Pressable
          onPress={() => router.push('/(app)/support')}
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: spacing.md,
            padding: spacing.lg,
          }}
        >
          <LifeBuoy size={18} color={colors.primary} />
          <View style={{ flex: 1 }}>
            <Text variant="bodyStrong">Support</Text>
            <Text variant="caption" color="mutedForeground">
              Get help from our team
            </Text>
          </View>
          <ChevronRight size={18} color={colors.mutedForeground} />
        </Pressable>
        <Divider />
        <Pressable
          onPress={() => router.push('/(app)/shortlets')}
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: spacing.md,
            padding: spacing.lg,
          }}
        >
          <BedDouble size={18} color={colors.primary} />
          <View style={{ flex: 1 }}>
            <Text variant="bodyStrong">Shortlet stays</Text>
            <Text variant="caption" color="mutedForeground">
              Book short stays and manage trips
            </Text>
          </View>
          <ChevronRight size={18} color={colors.mutedForeground} />
        </Pressable>
        <Divider />
        <Pressable
          onPress={() => router.push('/(app)/land')}
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: spacing.md,
            padding: spacing.lg,
          }}
        >
          <LandPlot size={18} color={colors.primary} />
          <View style={{ flex: 1 }}>
            <Text variant="bodyStrong">Land</Text>
            <Text variant="caption" color="mutedForeground">
              Browse verified land parcels
            </Text>
          </View>
          <ChevronRight size={18} color={colors.mutedForeground} />
        </Pressable>
        <Divider />
        <Pressable
          onPress={() => router.push('/(app)/help?messages=/(app)/(renter)/messages')}
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: spacing.md,
            padding: spacing.lg,
          }}
        >
          <CircleHelp size={18} color={colors.primary} />
          <View style={{ flex: 1 }}>
            <Text variant="bodyStrong">Help</Text>
            <Text variant="caption" color="mutedForeground">
              FAQs and contact options
            </Text>
          </View>
          <ChevronRight size={18} color={colors.mutedForeground} />
        </Pressable>
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
