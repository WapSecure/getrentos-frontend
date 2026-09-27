import { ArrowLeftRight } from 'lucide-react-native';
import { useAuth } from '@/lib/auth/AuthProvider';
import { PORTAL_LABEL } from '@/lib/roles';
import { SettingsGroup } from './SettingsList';

/**
 * For accounts with more than one workspace (an owner who also rents out,
 * a renter who is also buying): open another one. The choice is remembered on
 * this device. Renders nothing for single-workspace accounts.
 */
export function WorkspaceSwitcher() {
  const { workspaces, usablePortal, switchWorkspace } = useAuth();
  const others = workspaces.filter((p) => p !== usablePortal);
  if (!others.length) return null;
  return (
    <SettingsGroup
      title="Switch workspace"
      items={others.map((p) => ({
        key: p,
        label: PORTAL_LABEL[p],
        description: `Open your ${PORTAL_LABEL[p].toLowerCase()} workspace`,
        icon: ArrowLeftRight,
        onPress: () => switchWorkspace(p),
      }))}
    />
  );
}
