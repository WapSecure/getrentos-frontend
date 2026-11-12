import type { ReactNode } from 'react';
import { cn } from '@sureground/shared';

export const Container = ({ children, className }: { children: ReactNode; className?: string }) => (
  <div className={cn('mx-auto w-full max-w-[1240px] px-4 sm:px-6 lg:px-10', className)}>
    {children}
  </div>
);
