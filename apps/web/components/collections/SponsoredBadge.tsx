import { Badge } from '@sureground/ui';

/** Paid placement is always labelled, wherever a collection shows. */
export function SponsoredBadge({ className }: { className?: string }) {
  return (
    <Badge variant="warning" className={className}>
      Sponsored
    </Badge>
  );
}
