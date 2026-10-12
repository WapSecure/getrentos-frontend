'use client';

import Link from 'next/link';
import { BarChart3, FileText, LayoutGrid, Receipt } from 'lucide-react';
import { cn } from '@/lib/cn';
import { LAND_DEVELOPER_ROUTES } from '@/lib/constants/landDeveloperRoutes';

export type LandPropertySection = 'parcel' | 'layout' | 'sales' | 'analytics';

interface LandPropertyNavProps {
  propertyId: string;
  active: LandPropertySection;
  className?: string;
}

const SECTIONS: {
  key: LandPropertySection;
  label: string;
  icon: React.ElementType;
  href: (propertyId: string) => string;
}[] = [
  { key: 'parcel', label: 'Parcel & title', icon: FileText, href: LAND_DEVELOPER_ROUTES.portfolio },
  { key: 'layout', label: 'Estate layout', icon: LayoutGrid, href: LAND_DEVELOPER_ROUTES.layout },
  { key: 'sales', label: 'Sales', icon: Receipt, href: LAND_DEVELOPER_ROUTES.purchases },
  { key: 'analytics', label: 'Analytics', icon: BarChart3, href: LAND_DEVELOPER_ROUTES.analytics },
];

/** Moves between the views of one land property. Scrolls sideways on narrow screens. */
export const LandPropertyNav = ({ propertyId, active, className }: LandPropertyNavProps) => (
  <nav aria-label="Land property sections" className={cn('-mx-1 overflow-x-auto px-1', className)}>
    <ul className="flex w-max gap-1 rounded-xl bg-secondary p-1">
      {SECTIONS.map(({ key, label, icon: Icon, href }) => {
        const isActive = key === active;
        return (
          <li key={key}>
            <Link
              href={href(propertyId)}
              aria-current={isActive ? 'page' : undefined}
              className={cn(
                'inline-flex items-center gap-1.5 whitespace-nowrap rounded-lg px-3 py-1.5 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-card text-primary shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <Icon className="h-4 w-4" aria-hidden="true" />
              {label}
            </Link>
          </li>
        );
      })}
    </ul>
  </nav>
);
