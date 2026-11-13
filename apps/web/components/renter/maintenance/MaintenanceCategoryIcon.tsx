import {
  Droplets,
  Gauge,
  Hammer,
  Home,
  Lock,
  Palette,
  PawPrint,
  Power,
  Route,
  Tag,
  Waves,
  Wifi,
  Wrench,
  Zap,
} from '@sureground/icons';
import type { SelectOption } from '@sureground/ui';
import {
  MAINTENANCE_CATEGORY_GROUPS,
  MAINTENANCE_CATEGORY_LABELS,
  maintenanceCategoryIconName,
  type MaintenanceCategoryIconName,
} from '@sureground/shared';

/** The shared icon names mapped to this app's icon components. */
const ICONS: Record<MaintenanceCategoryIconName, typeof Wrench> = {
  Droplets,
  Gauge,
  Hammer,
  Home,
  Lock,
  Palette,
  PawPrint,
  Power,
  Route,
  Tag,
  Waves,
  Wifi,
  Wrench,
  Zap,
};

/** App icon for a category code in either case; unknown categories use the generic tag. */
export const maintenanceCategoryIcon = (category: string | null | undefined) =>
  ICONS[maintenanceCategoryIconName(category)];

/** Decorative: the category name always sits next to it. */
export const MaintenanceCategoryIcon = ({
  category,
  className,
}: {
  category: string | null | undefined;
  className?: string;
}) => {
  const Icon = maintenanceCategoryIcon(category);
  return <Icon className={className} aria-hidden />;
};

/**
 * Grouped picker options with icons. `lowercase` suits the renter routes, which take lowercase
 * codes; home management and the triage review take the UPPERCASE codes.
 */
export function maintenanceCategorySelectOptions({
  lowercase = false,
}: { lowercase?: boolean } = {}): SelectOption[] {
  return MAINTENANCE_CATEGORY_GROUPS.flatMap((group) =>
    group.categories.map((code) => {
      const label = MAINTENANCE_CATEGORY_LABELS[code];
      const Icon = ICONS[maintenanceCategoryIconName(code)];
      return {
        value: lowercase ? code.toLowerCase() : code,
        group: group.label,
        searchText: label,
        label: (
          <span className="inline-flex items-center gap-2">
            <Icon className="h-4 w-4 text-muted-foreground" aria-hidden />
            {label}
          </span>
        ),
      };
    })
  );
}
