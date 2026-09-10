'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, Check, X } from 'lucide-react';
import { Button } from '@getrentos/ui';
import type { Roommate } from '@/services/renterService';

interface RoommateInvitesCardProps {
  invites: Roommate[];
  onAccept: (id: string) => Promise<unknown>;
  onDecline: (id: string) => Promise<unknown>;
}

export const RoommateInvitesCard = ({ invites, onAccept, onDecline }: RoommateInvitesCardProps) => {
  const [pendingId, setPendingId] = useState<string | null>(null);

  if (invites.length === 0) return null;

  const respond = async (id: string, action: (id: string) => Promise<unknown>) => {
    if (pendingId) return;
    setPendingId(id);
    try {
      await action(id);
    } finally {
      setPendingId(null);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      className="mb-6 rounded-xl border border-amber-200 bg-amber-50 dark:border-amber-900 dark:bg-amber-950/20"
    >
      <div className="p-4">
        <div className="flex items-center gap-2">
          <Mail className="h-4 w-4 text-amber-600 dark:text-amber-400" />
          <h3 className="font-semibold text-amber-900 dark:text-amber-200">
            {invites.length === 1
              ? 'You have a roommate invite'
              : `You have ${invites.length} roommate invites`}
          </h3>
        </div>

        <AnimatePresence initial={false}>
          <ul className="mt-3 space-y-2">
            {invites.map((invite) => (
              <motion.li
                key={invite.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0, height: 0 }}
                className="flex flex-col gap-3 rounded-lg border border-amber-200/70 bg-card p-3 dark:border-amber-900/60 sm:flex-row sm:items-center sm:justify-between"
              >
                <p className="text-sm text-foreground">
                  <span className="font-medium">{invite.name}</span> invited you to share rent and
                  expenses.
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="primary"
                    size="sm"
                    className="gap-1"
                    disabled={pendingId === invite.id}
                    isLoading={pendingId === invite.id}
                    onClick={() => respond(invite.id, onAccept)}
                  >
                    <Check className="h-3.5 w-3.5" />
                    Accept
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-1"
                    disabled={pendingId === invite.id}
                    onClick={() => respond(invite.id, onDecline)}
                  >
                    <X className="h-3.5 w-3.5" />
                    Decline
                  </Button>
                </div>
              </motion.li>
            ))}
          </ul>
        </AnimatePresence>
      </div>
    </motion.div>
  );
};
