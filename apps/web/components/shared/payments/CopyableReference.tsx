'use client';

import { useState } from 'react';
import { Check, Copy } from '@sureground/icons';
import { IconButton } from '@sureground/ui';

/** A payment reference with a copy button: people quote it to support. */
export function CopyableReference({ value }: { value: string }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard access can be refused; the reference is on screen to read.
    }
  };
  return (
    <span className="inline-flex max-w-full items-center gap-1.5">
      <span className="select-all truncate font-mono text-xs" title={value}>
        {value}
      </span>
      <IconButton
        label={copied ? 'Copied' : 'Copy reference'}
        icon={copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
        variant="ghost"
        size="md"
        onClick={copy}
      />
      <span role="status" className="sr-only">
        {copied ? 'Reference copied' : ''}
      </span>
    </span>
  );
}
