import { ReactNode } from 'react';
import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/cn';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}

export const EmptyState = ({
  icon: Icon,
  title,
  description,
  action,
  className,
}: EmptyStateProps) => {
  return (
    <div className={cn('bg-card border border-border rounded-lg p-12 text-center', className)}>
      <Icon className="w-10 h-10 text-muted-foreground/50 mx-auto mb-3" />
      <p className="text-foreground font-medium">{title}</p>
      {description && <p className="text-muted-foreground text-sm mt-1">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
};
