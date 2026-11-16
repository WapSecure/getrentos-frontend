import { createElement } from 'react';
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

export const maintenanceCategoryIcon = (category: string | null | undefined) =>
  ICONS[maintenanceCategoryIconName(category)];

export const MaintenanceCategoryIcon = ({
  category,
  className,
}: {
  category: string | null | undefined;
  className?: string;
}) => {
  return createElement(ICONS[maintenanceCategoryIconName(category)], {
    className,
    'aria-hidden': true,
  });
};

/** `lowercase` suits the renter routes; home management and the triage review take UPPERCASE codes. */
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
