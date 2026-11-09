import { AlertOctagon, AlertTriangle, CheckCircle2 } from 'lucide-react';

export type CheckLevel = 'ok' | 'watch' | 'concern';

// Check tints are an icon colour, not a status chip, so they map to the
// semantic text tokens rather than to <Badge>.
const levelStyle: Record<
  CheckLevel,
  { icon: React.ElementType; className: string; label: string }
> = {
  concern: { icon: AlertOctagon, className: 'text-destructive', label: 'Concern' },
  watch: { icon: AlertTriangle, className: 'text-warning', label: 'Worth a look' },
  ok: { icon: CheckCircle2, className: 'text-success', label: 'Fine' },
};

/**
 * A list of checks worked out by Sureground, each marked fine, worth a look or
 * a concern. Used by applicant screening and the vendor invoice check.
 */
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
