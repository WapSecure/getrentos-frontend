import Link from 'next/link';
import { ChevronRight } from 'lucide-react';

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

export function Breadcrumbs({
  items,
  className = '',
  ariaLabel = 'Breadcrumb',
}: {
  items: BreadcrumbItem[];
  className?: string;
  ariaLabel?: string;
}) {
  return (
    <nav aria-label={ariaLabel} className={`mb-4 ${className}`}>
      <ol className="flex min-w-0 flex-wrap items-center gap-1.5 text-sm text-muted-foreground">
        {items.map((item, index) => {
          const current = index === items.length - 1;
          return (
            <li
              key={`${item.href ?? 'current'}-${item.label}`}
              className="flex min-w-0 items-center gap-1.5"
            >
              {index > 0 && <ChevronRight className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />}
              {item.href && !current ? (
                <Link
                  href={item.href}
                  className="truncate rounded-sm hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  {item.label}
                </Link>
              ) : (
                <span
                  className="truncate text-foreground"
                  aria-current={current ? 'page' : undefined}
                >
                  {item.label}
                </span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
