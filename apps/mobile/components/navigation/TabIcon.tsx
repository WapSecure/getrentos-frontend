import type { ColorValue } from 'react-native';
import { View } from 'react-native';
import type { SgNativeIcon } from '@sureground/icons/native';
import { useTheme, withAlpha } from '@sureground/ui-native';
import { TAB_ICON_SIZE, TAB_PILL } from '@/lib/navigationStyles';

type TabIconRenderProps = { focused: boolean; color: ColorValue; size: number };

/**
 * A tab's icon in its slot. The active tab sits on a soft Sureground blue pill, so the selected
 * tab reads at a glance and not only from its tint. Every role's tab bar draws its icons through
 * this, so the icons share one size and one active treatment.
 */
export function TabIcon({
  icon: Icon,
  focused,
  color,
}: {
  icon: SgNativeIcon;
  focused: boolean;
  color: ColorValue;
}) {
  const { colors, scheme } = useTheme();
  return (
    <View
      style={{
        width: TAB_PILL.width,
        height: TAB_PILL.height,
        borderRadius: TAB_PILL.height / 2,
        alignItems: 'center',
        justifyContent: 'center',
        // The dark palette's blue is lighter, so it needs a little more weight to show on the card.
        backgroundColor: focused
          ? withAlpha(colors.primary, scheme === 'dark' ? 0.2 : 0.12)
          : 'transparent',
      }}
    >
      <Icon size={TAB_ICON_SIZE} color={color} strokeWidth={focused ? 2.1 : 1.75} />
    </View>
  );
}

/** `tabBarIcon` for a tab screen: `tabBarIcon: tabIcon(Home)`. */
export function tabIcon(icon: SgNativeIcon) {
  function renderTabIcon({ focused, color }: TabIconRenderProps) {
    return <TabIcon icon={icon} focused={focused} color={color} />;
  }
  return renderTabIcon;
}
