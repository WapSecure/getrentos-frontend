import { formatLocation } from '@sureground/shared';
import { View } from 'react-native';
import { useState } from 'react';
import { router } from 'expo-router';
import { Footprints, KeyRound, LogOut, MapPin, ShieldCheck, Siren } from '@sureground/icons/native';
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
} from '@sureground/ui-native';
import { useGatemanPost } from '@/lib/gateman/GatemanPostProvider';
import { useAuth } from '@/lib/auth/AuthProvider';
import { useIdentityVerification } from '@/hooks/useIdentityVerification';
import { SettingsGroup } from '@/components/account/SettingsList';
import { WorkspaceSwitcher } from '@/components/account/WorkspaceSwitcher';
import { PostSwitcherSheet } from '@/components/gateman/PostSwitcherSheet';

export default function GatemanAccount() {
  const { profile, signOut } = useAuth();
  const { verified } = useIdentityVerification();
  const { colors, spacing } = useTheme();
  const [postSheetOpen, setPostSheetOpen] = useState(false);

  const { estate, estates, gate, isLoading: isPostLoading } = useGatemanPost();

  return (
    <>
      <Screen>
        <View style={{ alignItems: 'center', gap: spacing.sm, marginTop: spacing.xl }}>
          <Avatar name={profile?.legalName} size={72} />
          <Text variant="heading">{profile?.legalName ?? 'Sureground user'}</Text>
          <Text variant="callout" color="mutedForeground">
            {profile?.email ?? profile?.phone ?? ''}
          </Text>
          {verified ? (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
              <ShieldCheck size={14} color={colors.success} />
              <Text variant="caption" style={{ color: colors.success }}>
                Verified account
              </Text>
            </View>
          ) : null}
        </View>

        <WorkspaceSwitcher />

        <SettingsGroup
          title="Operations"
          items={[
            {
              key: 'patrol',
              label: 'Patrol',
              description: 'Checkpoints, schedules and patrol history',
              icon: Footprints,
              onPress: () => router.push('/(app)/(gateman)/gate-patrol'),
            },
            {
              key: 'incidents',
              label: 'Incidents',
              description: 'Report and review gate incidents',
              icon: Siren,
              onPress: () => router.push('/(app)/(gateman)/incidents'),
            },
          ]}
        />

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
                    {formatLocation(estate.address, estate.city, estate.state)}
                  </Text>
                  <Text variant="caption" color="mutedForeground">
                    {gate ? `At ${gate.name}` : 'No gate selected'}
                    {estates.length > 1 ? ` · one of ${estates.length} estates` : ''}
                  </Text>
                </View>
              </View>
              {/* Shown even for a single-estate guard: an estate with several gates still needs one chosen. */}
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
              Choose how Sureground looks on this device.
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
