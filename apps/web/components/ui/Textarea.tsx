'use client';

import { forwardRef, type TextareaHTMLAttributes } from 'react';
import { cn } from '@/lib/cn';

export const Textarea = forwardRef<
  HTMLTextAreaElement,
  TextareaHTMLAttributes<HTMLTextAreaElement>
>(({ className, disabled, ...props }, ref) => (
  <textarea
    ref={ref}
    disabled={disabled}
    className={cn(
      'min-h-24 w-full resize-y rounded-xl border border-border bg-card px-3.5 py-2.5 text-sm text-foreground outline-none transition-[border-color,background-color,box-shadow] duration-150 placeholder:text-muted-foreground',
      'hover:border-foreground/20',
      'focus:border-primary focus:ring-4 focus:ring-primary/12 disabled:cursor-not-allowed disabled:bg-secondary/60 disabled:opacity-60 disabled:hover:border-border',
      className
    )}
    {...props}
  />
));

Textarea.displayName = 'Textarea';
