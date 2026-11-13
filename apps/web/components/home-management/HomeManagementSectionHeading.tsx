'use client';

import { useEffect, useState, type ReactNode } from 'react';
import { cn } from '@sureground/shared';

interface HomeManagementSectionHeadingProps {
  id: string;
  title: string;
  description?: ReactNode;
  /** Beside the title, such as a count the server calculated. */
  meta?: ReactNode;
  actions?: ReactNode;
  className?: string;
}

/** A plain section title with one line of context, so each tab reads as a list, not a pitch. */
export function HomeManagementSectionHeading({
  id,
  title,
  description,
  meta,
  actions,
  className,
}: HomeManagementSectionHeadingProps) {
  return (
    <div
      className={cn('flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between', className)}
    >
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <h2 id={id} className="text-lg font-semibold tracking-[-0.01em] text-foreground">
            {title}
          </h2>
          {meta}
        </div>
        {description && (
          <p className="mt-0.5 max-w-2xl text-sm text-muted-foreground">{description}</p>
        )}
      </div>
      {actions && <div className="flex flex-col gap-2 sm:flex-row sm:items-center">{actions}</div>}
    </div>
  );
}

/**
 * Opens a section's create dialog when the page header asks for it. The request is a number so a
 * second click opens it again; the section reports back once it has acted, which clears the request
 * and stops the dialog reopening when the tab is left and revisited.
 */
export function useCreateRequest(
  request: number | undefined,
  open: () => void,
  onHandled: (() => void) | undefined,
  ready = true
) {
  const [seen, setSeen] = useState<number>();
  if (ready && request !== undefined && request !== seen) {
    setSeen(request);
    open();
  }
  useEffect(() => {
    if (request !== undefined && request === seen) onHandled?.();
    // Runs once per request: callers pass an inline onHandled, and rerunning it would repeat its notice.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [request, seen]);
}
