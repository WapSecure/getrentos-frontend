'use client';

import { Alert, Button, useToast } from '@getrentos/ui';

/**
 * Two-factor backup codes, shown once right after they are made. Each works a
 * single time in place of the authenticator code (security gap AU-07).
 */
export const BackupCodes = ({ codes, onDone }: { codes: string[]; onDone: () => void }) => {
  const toast = useToast();
  const text = codes.join('\n');

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success('Backup codes copied');
    } catch {
      toast.error('Copy did not work. Select the codes and copy them instead.');
    }
  };

  const download = () => {
    const url = URL.createObjectURL(
      new Blob([`GetRentos two-factor backup codes\nEach code works once.\n\n${text}\n`], {
        type: 'text/plain',
      })
    );
    const link = document.createElement('a');
    link.href = url;
    link.download = 'getrentos-backup-codes.txt';
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="mt-4 p-4 rounded-lg bg-muted/50 border border-border space-y-3">
      <h4 className="font-medium text-foreground">Save your backup codes</h4>
      <Alert variant="warning">
        If you lose your phone, each code lets you sign in once. Keep them somewhere safe. You
        won&apos;t see them again.
      </Alert>
      <ul
        className="grid grid-cols-2 gap-x-6 gap-y-1 font-mono text-sm text-foreground"
        aria-label="Backup codes"
      >
        {codes.map((code) => (
          <li key={code}>{code}</li>
        ))}
      </ul>
      <div className="flex flex-wrap justify-end gap-2">
        <Button variant="outline" size="sm" onClick={() => void copy()}>
          Copy
        </Button>
        <Button variant="outline" size="sm" onClick={download}>
          Download
        </Button>
        <Button variant="primary" size="sm" onClick={onDone}>
          I&apos;ve saved them
        </Button>
      </div>
    </div>
  );
};
