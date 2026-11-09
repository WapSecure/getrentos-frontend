import { AlertOctagon, AlertTriangle, CheckCircle2 } from 'lucide-react';

export type CheckLevel = 'ok' | 'watch' | 'concern';

const levelStyle: Record<
  CheckLevel,
  { icon: React.ElementType; className: string; label: string }
> = {
  concern: { icon: AlertOctagon, className: 'text-destructive', label: 'Concern' },
  watch: { icon: AlertTriangle, className: 'text-warning', label: 'Worth a look' },
  ok: { icon: CheckCircle2, className: 'text-success', label: 'Fine' },
};

export function CheckList({ items }: { items: { level: CheckLevel; text: string }[] }) {
  return (
    <ul className="space-y-1.5">
      {items.map((item) => {
        const style = levelStyle[item.level];
        const Icon = style.icon;
        return (
          <li key={item.text} className="flex items-start gap-2 text-sm text-foreground">
            <Icon className={`w-4 h-4 mt-0.5 shrink-0 ${style.className}`} aria-hidden="true" />
            <span>
              <span className="sr-only">{style.label}: </span>
              {item.text}
            </span>
          </li>
        );
      })}
    </ul>
  );
}
