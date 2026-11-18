import { Badge } from '@sureground/ui';

/** Paid placement must be labelled so it is never mistaken for an organic result. */
export function BoostedBadge() {
  return (
    <Badge variant="neutral" className="border-transparent bg-card text-foreground shadow-xs">
      Boosted
    </Badge>
  );
}
