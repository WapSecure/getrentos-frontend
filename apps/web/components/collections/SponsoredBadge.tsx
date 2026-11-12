import { Badge } from '@sureground/ui/Badge';

/** Paid placement is always labelled, wherever a collection shows. */
export function SponsoredBadge({ className }: { className?: string }) {
  return (
    <Badge variant="warning" className={className}>
      Sponsored
    </Badge>
  );
}
