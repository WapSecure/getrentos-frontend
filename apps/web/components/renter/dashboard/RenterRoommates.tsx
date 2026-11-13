'use client';

import { motion } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { UserPlus, Mail, CheckCircle } from '@sureground/icons';
import { Button } from '@sureground/ui';
import { useToast } from '@sureground/ui';
import { useState } from 'react';
import { isNoAccountMessage } from '@sureground/shared';
import { ROUTES } from '@/lib/constants/auth';
import { ContactField, contactIsReady } from '@/components/shared/contact/ContactField';
import { InviteToSignUp } from '@/components/shared/representatives/InviteToSignUp';
import { renterService } from '@/services/renterService';
import { unwrap } from '@/lib/apiHelpers';
import { renterKeys } from '@/lib/queryKeys';

export const RenterRoommates = () => {
  const queryClient = useQueryClient();
  const { data: roommates = [] } = useQuery({
    queryKey: renterKeys.roommates,
    queryFn: () => unwrap(renterService.listRoommates()),
  });
  const [showInvite, setShowInvite] = useState(false);
  const [inviteContact, setInviteContact] = useState('');
  const [noAccount, setNoAccount] = useState(false);
  const toast = useToast();

  const totalShare = roommates.reduce((sum, r) => sum + r.sharePercentage, 0);

  const inviteMutation = useMutation({
    mutationFn: (contact: string) => renterService.inviteRoommate(contact),
    onSuccess: (res) => {
      if (res.success && res.data) {
        queryClient.invalidateQueries({ queryKey: renterKeys.roommates });
        toast.success(`Invite sent to ${inviteContact.trim()}`);
        setInviteContact('');
        setShowInvite(false);
      } else if (isNoAccountMessage(res.message)) {
        setNoAccount(true);
      } else {
        toast.error(res.message || 'We could not send the invite. Try again.');
      }
    },
  });

  const handleSendInvite = () => {
    if (!contactIsReady(inviteContact)) {
      toast.error('Enter their phone number or email.');
      return;
    }
    setNoAccount(false);
    inviteMutation.mutate(inviteContact.trim());
  };

  if (roommates.length === 0) return null;

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.65, duration: 0.4 }}
        className="overflow-hidden rounded-xl border border-border bg-card shadow-xs"
      >
        <div className="border-b border-border px-5 py-4">
          <div className="flex flex-wrap justify-between items-center gap-3">
            <div>
              <h2 className="text-base font-semibold tracking-[-0.015em] text-foreground">
                Roommates
              </h2>
              <p className="text-sm text-muted-foreground">Manage shared living arrangements</p>
            </div>
            <Button size="sm" className="gap-1" onClick={() => setShowInvite(!showInvite)}>
              <UserPlus className="w-3 h-3" />
              Invite
            </Button>
          </div>
        </div>

        {showInvite && (
          <div className="p-4 border-b border-border bg-secondary/60">
            <div className="flex flex-wrap items-end gap-2">
              <div className="min-w-0 flex-1">
                <ContactField
                  id="dashboard-roommate-contact"
                  label="Roommate's phone number or email"
                  hint="They'll need to accept to join your household"
                  value={inviteContact}
                  onChange={(next) => {
                    setInviteContact(next);
                    setNoAccount(false);
                  }}
                />
              </div>
              <Button
                size="sm"
                onClick={handleSendInvite}
                isLoading={inviteMutation.isPending}
                className="mb-6"
              >
                Send invite
              </Button>
            </div>
            {noAccount && (
              <InviteToSignUp
                message="Nobody on Sureground uses that phone number yet. Send them the signup link."
                reason="share rent and household costs with you"
                footnote="Once they have signed up, invite them here with the same phone number."
              />
            )}
          </div>
        )}

        <div className="p-4 space-y-3">
          {roommates.map((roommate, index) => (
            <motion.div
              key={roommate.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.7 + index * 0.05, duration: 0.3 }}
              className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-lg bg-secondary/60"
            >
              <div className="flex min-w-0 items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary font-semibold text-primary-foreground">
                  {roommate.name.charAt(0)}
                </div>
                <div>
                  <p className="font-medium text-foreground">{roommate.name}</p>
                  {(roommate.email || roommate.phone) && (
                    <div className="flex items-center gap-2 mt-0.5">
                      <Mail className="w-3 h-3 text-muted-foreground" />
                      <span className="text-xs text-muted-foreground">
                        {roommate.email || roommate.phone}
                      </span>
                    </div>
                  )}
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm font-semibold text-primary">
                  {roommate.sharePercentage}% share
                </p>
                <div className="flex items-center gap-1 mt-1">
                  <CheckCircle className="w-3 h-3 text-success" />
                  <span className="text-xs text-muted-foreground">Verified</span>
                </div>
              </div>
            </motion.div>
          ))}

          <div className="mt-4 p-3 rounded-lg bg-accent border border-primary/20">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium text-foreground">Rent split</span>
              <span className="text-sm font-medium text-foreground">{totalShare}% allocated</span>
            </div>
            <div className="h-2 bg-secondary rounded-full overflow-hidden">
              <div className="h-full bg-primary rounded-full" style={{ width: `${totalShare}%` }} />
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              {totalShare === 100 ? 'All rent allocated' : `${100 - totalShare}% unallocated`}
            </p>
          </div>

          <Button
            variant="outline"
            fullWidth
            size="sm"
            className="mt-2 gap-1"
            href={ROUTES.RENTER_PAYMENTS}
          >
            <span className="text-sm">₦</span>
            Split payments
          </Button>
        </div>
      </motion.div>
    </>
  );
};
