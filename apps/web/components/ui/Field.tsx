import { type ReactNode } from 'react';
import { cn } from '@/lib/cn';

interface FieldProps {
  label: ReactNode;
  children: ReactNode;
  htmlFor?: string;
  hint?: ReactNode;
  error?: ReactNode;
  required?: boolean;
  className?: string;
}

export function Field({ label, children, htmlFor, hint, error, required, className }: FieldProps) {
  return (
    <div className={cn('space-y-1.5', className)}>
      <label htmlFor={htmlFor} className="block text-sm font-medium tracking-[-0.01em] text-foreground">
        {label}{required && <span className="ml-1 text-destructive">*</span>}
      </label>
      {children}
      {(error || hint) && <p className={cn('text-xs', error ? 'text-destructive' : 'text-muted-foreground')}>{error ?? hint}</p>}
    </div>
  );
}
