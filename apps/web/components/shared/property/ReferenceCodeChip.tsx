'use client';

import { useState } from 'react';
import { Check, Copy } from 'lucide-react';

/**
 * A property's shareable reference code (PR-AB7K-9Q) with one-tap copy.
 *
 * This is the handle an owner reads out and an agent types, so it has to be easy
 * to lift off the screen — far more than a UUID ever was. Shared across the owner
 * and landlord property views (where the owner copies it to share) and the
 * managed-properties view (where the holder sees which property a mandate is for).
 */
export const ReferenceCodeChip = ({
  code,
  className = '',
}: {
  code: string;
  className?: string;
}) => {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // Clipboard access can be blocked (insecure context, denied permission).
      // The code is still on screen to copy by hand, so a failure isn't worth surfacing.
    }
  };

  return (
    <button
      type="button"
      onClick={copy}
      title="Copy property code"
      aria-label={copied ? `Property code ${code} copied` : `Copy property code ${code}`}
      className={`inline-flex items-center gap-1.5 rounded-lg border border-border bg-background px-2 py-1 font-mono text-xs text-foreground transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${className}`}
    >
      {code}
      {copied ? (
        <Check className="h-3 w-3 text-success" />
      ) : (
        <Copy className="h-3 w-3 text-muted-foreground" />
      )}
    </button>
  );
};
