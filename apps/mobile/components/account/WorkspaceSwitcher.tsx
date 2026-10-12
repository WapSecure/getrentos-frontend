import { useState } from 'react';
import { Pressable, View } from 'react-native';
import { ArrowLeftRight, Plus } from 'lucide-react-native';
import { Text, useTheme, useToast } from '@getrentos/ui-native';
import { useAuth } from '@/lib/auth/AuthProvider';
import {
  PORTAL_LABEL,
  SIGNUP_ROLES,
  VERIFICATION_LABEL,
  portalsForRoles,
  type Portal,
  type SignupRoleId,
} from '@/lib/roles';
import { accountRolesApi } from '@/lib/api/accountRoles';
import { ApiError } from '@/lib/api/client';
import { Sheet } from '@/components/Sheet';
import { SettingsGroup } from './SettingsList';

/**
 * Open another workspace this account has (an owner who also rents out, a
 * renter who is also buying), or add a role it doesn't have yet. The choice of
 * workspace is remembered on this device.
 */
export function WorkspaceSwitcher() {
  const { workspaces, usablePortal, switchWorkspace } = useAuth();
  const [adding, setAdding] = useState(false);
  const others = workspaces.filter((p) => p !== usablePortal);
  return (
    <>
      <SettingsGroup
        title="Workspaces"
        items={[
          ...others.map((p) => ({
            key: p,
            label: PORTAL_LABEL[p],
            description: `Open your ${PORTAL_LABEL[p].toLowerCase()} workspace`,
            icon: ArrowLeftRight,
            onPress: () => switchWorkspace(p),
          })),
          {
            key: 'add-role',
            label: 'Add a role',
            description: 'Rent, own, buy and more from this one account',
            icon: Plus,
            onPress: () => setAdding(true),
          },
        ]}
      />
      <Sheet open={adding} onClose={() => setAdding(false)} title="Add a role">
        {adding ? <AddRoleList onDone={() => setAdding(false)} /> : null}
      </Sheet>
    </>
  );
}

function AddRoleList({ onDone }: { onDone: () => void }) {
  const { colors, spacing, radius } = useTheme();
  const toast = useToast();
  const { profile, refreshProfile, switchWorkspace } = useAuth();
  const [busy, setBusy] = useState<SignupRoleId | null>(null);
  const held = new Set<Portal>(portalsForRoles(profile?.roles ?? []));
  const available = SIGNUP_ROLES.filter((r) => !held.has(r.id));

  const add = async (role: SignupRoleId) => {
    setBusy(role);
    try {
      await accountRolesApi.add(role);
      await refreshProfile();
      switchWorkspace(role);
      toast.show(
        `Added. You're now in your ${PORTAL_LABEL[role].toLowerCase()} workspace.`,
        'success'
      );
      onDone();
    } catch (e) {
      toast.show(e instanceof ApiError ? e.message : 'Could not add that role.', 'error');
    } finally {
      setBusy(null);
    }
  };

  if (!available.length) {
    return (
      <Text variant="callout" color="mutedForeground">
        Your account already has every role.
      </Text>
    );
  }
  return (
    <View style={{ gap: spacing.sm }}>
      {available.map((r) => (
        <Pressable
          key={r.id}
          onPress={() => void add(r.id)}
          disabled={busy != null}
          accessibilityRole="button"
          accessibilityLabel={`Add ${r.name}`}
          style={{
            gap: 2,
            padding: spacing.md,
            borderRadius: radius.lg,
            borderWidth: 1,
            borderColor: colors.border,
            opacity: busy && busy !== r.id ? 0.5 : 1,
          }}
        >
          <Text variant="bodyStrong">{busy === r.id ? `Adding ${r.name}…` : r.name}</Text>
          <Text variant="caption" color="mutedForeground">
            {r.tagline}
          </Text>
          {r.requires.length ? (
            <Text variant="caption" color="mutedForeground">
              Checked when needed: {r.requires.map((q) => VERIFICATION_LABEL[q]).join(', ')}
            </Text>
          ) : null}
        </Pressable>
      ))}
      <Text variant="caption" color="mutedForeground">
        Nothing to upload now. Each check is asked for when you first do something that needs it.
      </Text>
    </View>
  );
}
