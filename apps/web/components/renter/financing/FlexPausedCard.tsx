import { Clock, Zap } from 'lucide-react';

/** Shown instead of the Flex sign-up while Flex isn't taking new plans. */
export const FlexPausedCard = () => (
  <div className="overflow-hidden rounded-[1.75rem] border border-border/70 bg-card shadow-sm">
    <div className="p-6 sm:p-7">
      <div className="flex items-center gap-2 mb-2">
        <Zap className="w-5 h-5 text-primary" />
        <span className="text-xs font-semibold uppercase tracking-wide text-primary">
          GetRentos Flex
        </span>
      </div>
      <h1 className="text-2xl font-bold text-foreground">Not taking new plans right now</h1>
      <p className="text-sm text-muted-foreground mt-2 max-w-lg">
        We&apos;re setting Flex up with a funding partner so landlords are paid in full from day
        one. Until then we aren&apos;t starting new monthly plans. Your rent and payments work as
        usual, and plans that already exist are not affected.
      </p>
      <div className="mt-5 flex items-start gap-2 rounded-2xl border border-border/70 bg-secondary/40 p-4 text-sm text-muted-foreground">
        <Clock className="w-4 h-4 mt-0.5 shrink-0" />
        <span>Coming back soon. This page will let you apply as soon as Flex reopens.</span>
      </div>
    </div>
  </div>
);
