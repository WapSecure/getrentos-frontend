import Link from 'next/link';
import { cn } from '@sureground/shared';
import { DEVELOPMENTS_PATH } from '@/lib/publicDevelopments';

const TABS = [
  { key: 'homes', label: 'Homes for sale', href: '/buy' },
  { key: 'developments', label: 'Off-plan developments', href: DEVELOPMENTS_PATH },
] as const;

/** Buying has two places to look: finished homes, and off-plan developments (listed only). */
export function BuyMarketTabs({
  current,
  className,
}: {
  current: (typeof TABS)[number]['key'];
  className?: string;
}) {
  return (
    <nav aria-label="What to buy" className={cn('border-b border-border', className)}>
      <ul className="flex gap-5 overflow-x-auto">
        {TABS.map((tab) => (
          <li key={tab.key}>
            <Link
              href={tab.href}
              aria-current={tab.key === current ? 'page' : undefined}
              className={cn(
                '-mb-px inline-flex min-h-11 items-center whitespace-nowrap rounded-t-sm border-b-2 border-transparent px-0.5 text-sm font-medium transition-colors',
                'text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                'aria-[current=page]:border-primary aria-[current=page]:text-foreground'
              )}
            >
              {tab.label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
