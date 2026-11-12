import { Droplets, Lock, Tag, Wifi, Wrench, Zap } from '@sureground/icons';

/** App icons for maintenance categories; unknown categories use the generic tag. */
const ICONS: Record<string, typeof Wrench> = {
  plumbing: Droplets,
  electrical: Zap,
  internet: Wifi,
  security: Lock,
  appliances: Wrench,
  other: Tag,
};

/** Decorative: the category name always sits next to it. */
export const MaintenanceCategoryIcon = ({
  category,
  className,
}: {
  category: string | null | undefined;
  className?: string;
}) => {
  const Icon = (category && ICONS[category]) || Tag;
  return <Icon className={className} aria-hidden />;
};
