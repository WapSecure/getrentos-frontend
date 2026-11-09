'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useRef, type ElementType } from 'react';
import { cn } from '@/lib/cn';

export interface SectionNavItem {
  label: string;
  href: string;
  icon?: ElementType;
}

interface SectionNavProps {
  /** Names the group of pages for screen readers, e.g. "Lettings". */
  ariaLabel: string;
  items: SectionNavItem[];
  className?: string;
}

/**
 * Links between the pages of one workflow (a lettings or sales pipeline), so a
 * person can step through it without going back to the sidebar. Looks like the
 * underline tabs in @sureground/ui, but each entry is a page, so it is a list of
 * links with `aria-current`, not a tab list. Scrolls sideways on narrow screens.
 */
export function SectionNav({ ariaLabel, items, className }: SectionNavProps) {
  const pathname = usePathname();
  const active = items
    .map((item) => item.href)
    .filter((href) => pathname === href || pathname.startsWith(`${href}/`))
    .sort((a, b) => b.length - a.length)[0];
  // On a narrow screen the strip scrolls sideways: bring the current page into
  // view, so "Leads" is not hidden off the edge when you land on it.
  const currentRef = useRef<HTMLAnchorElement>(null);
  useEffect(() => {
    currentRef.current?.scrollIntoView({ block: 'nearest', inline: 'nearest' });
  }, [active]);

  return (
    <nav aria-label={ariaLabel} className={cn('-mt-2 mb-6 overflow-x-auto', className)}>
      <ul className="flex w-full min-w-max gap-5 border-b border-border">
        {items.map(({ label, href, icon: Icon }) => {
          const current = href === active;
          return (
            <li key={href}>
              <Link
                href={href}
                ref={current ? currentRef : undefined}
                aria-current={current ? 'page' : undefined}
                className={cn(
                  '-mb-px inline-flex min-h-11 items-center gap-2 whitespace-nowrap rounded-t-sm border-b-2 px-0.5 pb-2.5 pt-1 text-sm font-medium transition-colors',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                  current
                    ? 'border-primary text-foreground'
                    : 'border-transparent text-muted-foreground hover:text-foreground'
                )}
              >
                {Icon && <Icon className="h-4 w-4" aria-hidden="true" />}
                {label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
