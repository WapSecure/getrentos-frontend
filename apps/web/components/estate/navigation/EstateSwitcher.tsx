'use client';

import Link from 'next/link';
import { ChevronDown, Check, Plus, Building2 } from '@sureground/icons';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@sureground/ui';
import { ROUTES } from '@/lib/constants/auth';
import { useSelectedEstate } from '@/app/(dashboard)/estate/layout';
import { usePlanTier } from '@/hooks/usePlanTier';

export const EstateSwitcher = () => {
  const { estate, estates, selectEstate } = useSelectedEstate();
  const { isPro } = usePlanTier();

  if (estates.length === 0) return null;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="group flex items-center gap-2 px-3 py-1.5 min-w-0 rounded-lg border border-border hover:bg-secondary transition-colors max-w-[10rem] sm:max-w-[14rem] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
        <Building2 className="w-4 h-4 text-muted-foreground shrink-0" aria-hidden="true" />
        <span className="text-sm font-medium text-foreground truncate">
          {estate?.name ?? 'Select estate'}
        </span>
        <ChevronDown
          className="w-3.5 h-3.5 text-muted-foreground shrink-0 transition-transform duration-200 group-data-[state=open]:rotate-180"
          aria-hidden="true"
        />
      </DropdownMenuTrigger>

      <DropdownMenuContent align="start">
        <DropdownMenuLabel className="px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
          Your estates
        </DropdownMenuLabel>
        <div className="max-h-64 overflow-y-auto">
          {estates.map((option) => (
            <DropdownMenuItem
              key={option.id}
              onSelect={() => selectEstate(option.id)}
              className="justify-between"
            >
              <span className="truncate">{option.name}</span>
              {option.id === estate?.id && (
                <Check className="w-4 h-4 text-primary shrink-0" aria-label="Selected" />
              )}
            </DropdownMenuItem>
          ))}
        </div>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild className="text-primary">
          {/* The API refuses a second estate on Free, so Free goes to the plan instead of a form that fails. */}
          <Link href={isPro ? ROUTES.ESTATE_SETUP : ROUTES.ESTATE_BILLING}>
            <Plus className="w-4 h-4" aria-hidden="true" />
            {isPro ? 'Add another estate' : 'Add another estate with Pro'}
          </Link>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
