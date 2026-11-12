/** The same caveat on every guide: general information, from a service, not advice. */
export const LegalNote = ({ className }: { className?: string }) => (
  <p className={className ?? 'text-sm leading-relaxed text-muted-foreground'}>
    General information about how Sureground works, not legal, tax or investment advice. Laws and
    charges change; take your own professional advice before you commit.
  </p>
);
