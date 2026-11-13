import type { ReactNode } from 'react';

export function ShowroomSection({
  id,
  title,
  children,
}: {
  id: string;
  title: string;
  children: ReactNode;
}) {
  return (
    <section aria-labelledby={id} className="border-t border-border/70 pt-8">
      <h2
        id={id}
        className="font-display text-[1.625rem] leading-tight font-normal tracking-[-0.01em] text-foreground sm:text-[1.875rem]"
      >
        {title}
      </h2>
      <div className="mt-5">{children}</div>
    </section>
  );
}
