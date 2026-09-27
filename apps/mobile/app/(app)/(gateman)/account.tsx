import { View } from 'react-native';
import { useState } from 'react';
import { router } from 'expo-router';
import { LogOut, MapPin, KeyRound, ShieldCheck } from 'lucide-react-native';
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
import { useGatemanPost } from '@/lib/gateman/GatemanPostProvider';
import { useAuth } from '@/lib/auth/AuthProvider';
import { SettingsGroup } from '@/components/account/SettingsList';
import { WorkspaceSwitcher } from '@/components/account/WorkspaceSwitcher';
import { PostSwitcherSheet } from '@/components/gateman/PostSwitcherSheet';

export default function GatemanAccount() {
  const { profile, signOut } = useAuth();
  const { colors, spacing } = useTheme();
  const [postSheetOpen, setPostSheetOpen] = useState(false);

  const { estate, estates, gate, isLoading: isPostLoading } = useGatemanPost();

  return (
    <>
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
                Verified account
              </Text>
            </View>
          ) : null}
        </View>

        {/* Portals, not posts: for an account that is also a landlord or a buyer.
            Renders nothing for a single-workspace guard. */}
        <WorkspaceSwitcher />

        <Card elevated>
          <Text variant="bodyStrong">Your post</Text>
          {isPostLoading ? (
            <Skeleton height={40} radius={10} />
          ) : estate ? (
            <View style={{ gap: spacing.md }}>
              <View style={{ flexDirection: 'row', gap: spacing.sm, alignItems: 'flex-start' }}>
                <MapPin size={16} color={colors.mutedForeground} style={{ marginTop: 2 }} />
                <View style={{ flex: 1, gap: 2 }}>
                  <Text variant="body">{estate.name}</Text>
                  <Text variant="caption" color="mutedForeground">
                    {estate.address}, {estate.city} {estate.state}
                  </Text>
                  <Text variant="caption" color="mutedForeground">
                    {gate ? `At ${gate.name}` : 'No gate selected'}
                    {estates.length > 1 ? ` · one of ${estates.length} estates` : ''}
                  </Text>
                </View>
              </View>
              {/* Shown even for a single-estate guard: the gate still has to be
                chosen when an estate names more than one, and this is where
                they will come looking for it. */}
              <Button
                label="Change estate or gate"
                variant="outline"
                size="sm"
                fullWidth={false}
                onPress={() => setPostSheetOpen(true)}
              />
            </View>
          ) : (
            <Text variant="caption" color="mutedForeground">
              You aren&apos;t posted to an estate yet. Ask your estate manager to invite you.
            </Text>
          )}
        </Card>

        <SettingsGroup
          title="Account"
          items={[
            {
              key: 'security',
              label: 'Security',
              description: 'Password, two-factor and app lock',
              icon: KeyRound,
              onPress: () => router.push('/(app)/security-settings'),
            },
          ]}
        />

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

      <PostSwitcherSheet open={postSheetOpen} onClose={() => setPostSheetOpen(false)} />
    </>
  );
}
