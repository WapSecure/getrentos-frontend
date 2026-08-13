'use client';

import { forwardRef, type TextareaHTMLAttributes } from 'react';
import { cn } from '@/lib/cn';

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaHTMLAttributes<HTMLTextAreaElement>>(
  ({ className, disabled, ...props }, ref) => (
    <textarea
      ref={ref}
      disabled={disabled}
      className={cn(
        'min-h-24 w-full resize-y rounded-xl border border-border bg-card px-3 py-2.5 text-sm text-foreground shadow-[0_1px_1px_rgba(0,0,0,0.02)] outline-none transition-[border-color,box-shadow,background-color] duration-150 placeholder:text-muted-foreground',
        'focus:border-primary/70 focus:ring-4 focus:ring-primary/12 disabled:cursor-not-allowed disabled:bg-secondary/60 disabled:opacity-60',
        className
      )}
      {...props}
    />
  )
);

Textarea.displayName = 'Textarea';
