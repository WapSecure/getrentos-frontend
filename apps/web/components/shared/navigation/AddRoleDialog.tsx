'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Briefcase, Loader2, Plus } from 'lucide-react';
import { Alert, Dialog, DialogContent, DialogDescription, DialogTitle } from '@getrentos/ui';
import { BACKEND_ROLE_TO_ID, ROLES } from '@/lib/constants/auth';
import { getStoredUser } from '@/lib/authStorage';
import { useAddRole } from '@/hooks/useAddRole';
import { ADDABLE_ROLE_IDS, type AddableRoleId } from '@/services/accountRolesService';

/**
 * Take on another role with the same account: one login can rent, own, buy
 * and so on. Nothing is asked for here, as at sign-up; anything that needs a
 * document (identity, ownership, a licence) asks for it when it is used.
 */
export const AddRoleDialog = ({
  open,
  onClose,
  heldRoles,
}: {
  open: boolean;
  onClose: () => void;
  /** Role codes the account already holds. */
  heldRoles: string[];
}) => {
  const addRole = useAddRole();
  const held = new Set(heldRoles.map((r) => BACKEND_ROLE_TO_ID[r]).filter(Boolean));
  const available = ADDABLE_ROLE_IDS.filter((id) => !held.has(id)).map((id) => ({
    id,
    def: Object.values(ROLES).find((r) => r.id === id),
  }));

  return (
    <Dialog open={open} onOpenChange={(next) => !next && onClose()}>
      <DialogContent className="max-w-md p-0">
        <div className="border-b border-border p-4">
          <DialogTitle className="text-xl font-semibold tracking-[-0.02em] text-foreground">
            Add a role
          </DialogTitle>
          <DialogDescription className="mt-0.5 text-xs text-muted-foreground">
            Use the same account for more of GetRentos. You can switch between roles any time.
          </DialogDescription>
        </div>
        <div className="space-y-2 p-4">
          {available.length === 0 ? (
            <p className="text-sm text-muted-foreground">Your account already has every role.</p>
          ) : (
            available.map(({ id, def }) => (
              <button
                key={id}
                type="button"
                disabled={addRole.isPending}
                aria-busy={(addRole.isPending && addRole.variables?.role === id) || undefined}
                onClick={() => addRole.mutate({ role: id as AddableRoleId })}
                className="flex w-full items-start gap-3 rounded-xl border border-border p-3 text-left transition-colors hover:border-primary/40 hover:bg-secondary disabled:opacity-60"
              >
                {addRole.isPending && addRole.variables?.role === id ? (
                  <Loader2 className="mt-0.5 h-4 w-4 shrink-0 animate-spin text-primary" />
                ) : (
                  <Plus className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                )}
                <span>
                  <span className="block text-sm font-medium text-foreground">
                    {def?.name ?? id}
                  </span>
                  {def?.description && (
                    <span className="block text-xs text-muted-foreground">{def.description}</span>
                  )}
                </span>
              </button>
            ))
          )}
          {!held.has('manager') && (
            // A firm is not a role you add: it is a business GetRentos verifies,
            // so it has its own setup rather than a one-tap switch.
            <Link
              href="/agency/setup"
              onClick={onClose}
              className="flex w-full items-start gap-3 rounded-xl border border-dashed border-border p-3 text-left transition-colors hover:border-primary/40 hover:bg-secondary"
            >
              <Briefcase className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
              <span>
                <span className="block text-sm font-medium text-foreground">
                  Run a property management firm
                </span>
                <span className="block text-xs text-muted-foreground">
                  Manage properties for owners. Set up your firm and get it verified.
                </span>
              </span>
            </Link>
          )}
          {addRole.error && (
            <Alert variant="danger">
              {addRole.error instanceof Error ? addRole.error.message : 'Could not add that role.'}
            </Alert>
          )}
          <p className="pt-1 text-xs text-muted-foreground">
            Some actions in a new role need extra checks, such as identity verification before
            payments, or proof of ownership before listing. You&apos;ll be asked when you get there.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
};

const OPEN_EVENT = 'getrentos:add-role';

/**
 * Opens the add-role dialog from anywhere, such as a profile menu. The menu
 * is closed first (they close on an outside click), so the dialog is not
 * drawn underneath it.
 */
export function openAddRoleDialog() {
  document.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
  window.dispatchEvent(new Event(OPEN_EVENT));
}

/** The one add-role dialog for the signed-in app; mounted in the dashboard layout. */
export const AddRoleDialogHost = () => {
  const [open, setOpen] = useState(false);
  const [held, setHeld] = useState<string[]>([]);
  useEffect(() => {
    const show = () => {
      setHeld(getStoredUser<{ roles?: string[] }>()?.roles ?? []);
      setOpen(true);
    };
    window.addEventListener(OPEN_EVENT, show);
    return () => window.removeEventListener(OPEN_EVENT, show);
  }, []);
  return <AddRoleDialog open={open} onClose={() => setOpen(false)} heldRoles={held} />;
};
