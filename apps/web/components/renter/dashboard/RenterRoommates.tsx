'use client';

import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { UserPlus, Mail, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Toast, ToastVariant } from '@/components/ui/Toast';
import { useEffect, useState } from 'react';
import { ROUTES } from '@/lib/constants/auth';
import { renterService, type Roommate } from '@/services/renterService';

export const RenterRoommates = () => {
  const router = useRouter();
  const [roommates, setRoommates] = useState<Roommate[]>([]);
  const [showInvite, setShowInvite] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [toast, setToast] = useState<{ message: string; variant: ToastVariant } | null>(null);

  useEffect(() => {
    const load = async () => {
      const res = await renterService.listRoommates();
      if (res.success && res.data) setRoommates(res.data);
    };
    load();
  }, []);

  const totalShare = roommates.reduce((sum, r) => sum + r.sharePercentage, 0);

  const handleSendInvite = async () => {
    if (!inviteEmail.trim() || !inviteEmail.includes('@')) {
      setToast({ message: 'Enter a valid email address', variant: 'error' });
      return;
    }
    const res = await renterService.inviteRoommate(inviteEmail);
    if (res.success && res.data) {
      const created = res.data;
      setRoommates((prev) => [...prev, created]);
      setToast({ message: `Invite sent to ${inviteEmail}`, variant: 'success' });
      setInviteEmail('');
      setShowInvite(false);
    } else {
      setToast({ message: res.message || 'Failed to send invite', variant: 'error' });
    }
  };

  return (
    <>
      {toast && (
        <Toast message={toast.message} variant={toast.variant} onClose={() => setToast(null)} />
      )}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.65, duration: 0.4 }}
        className="bg-card rounded-xl border border-border overflow-hidden"
      >
        <div className="p-4 border-b border-border">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-lg font-semibold text-foreground">Roommates</h2>
              <p className="text-sm text-muted-foreground">Manage shared living arrangements</p>
            </div>
            <Button size="sm" className="gap-1" onClick={() => setShowInvite(!showInvite)}>
              <UserPlus className="w-3 h-3" />
              Invite
            </Button>
          </div>
        </div>

        {showInvite && (
          <div className="p-4 border-b border-border bg-gray-50 dark:bg-white/5">
            <div className="flex gap-2">
              <input
                type="email"
                placeholder="Enter roommate's email"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                className="flex-1 px-3 py-2 text-sm rounded-lg border border-border bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              />
              <Button size="sm" onClick={handleSendInvite}>
                Send Invite
              </Button>
            </div>
            <p className="text-xs text-gray-500 mt-2">
              They&apos;ll need to accept to join your household
            </p>
          </div>
        )}

        <div className="p-4 space-y-3">
          {roommates.map((roommate, index) => (
            <motion.div
              key={roommate.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.7 + index * 0.05, duration: 0.3 }}
              className="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-white/5"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-linear-to-r from-primary to-primary/60 flex items-center justify-center text-primary-foreground font-semibold">
                  {roommate.name.charAt(0)}
                </div>
                <div>
                  <p className="font-medium text-foreground">{roommate.name}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <Mail className="w-3 h-3 text-gray-400" />
                    <span className="text-xs text-gray-500">{roommate.email}</span>
                  </div>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm font-semibold text-primary">
                  {roommate.sharePercentage}% share
                </p>
                <div className="flex items-center gap-1 mt-1">
                  <CheckCircle className="w-3 h-3 text-green-500" />
                  <span className="text-xs text-gray-500">Verified</span>
                </div>
              </div>
            </motion.div>
          ))}

          {/* Rent Split Summary */}
          <div className="mt-4 p-3 rounded-lg bg-accent border border-primary/20">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium text-foreground">Monthly Rent Split</span>
              <span className="text-sm font-medium text-foreground">{totalShare}% allocated</span>
            </div>
            <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
              <div className="h-full bg-primary rounded-full" style={{ width: `${totalShare}%` }} />
            </div>
            <p className="text-xs text-gray-500 mt-2">
              {totalShare === 100 ? 'All rent allocated' : `${100 - totalShare}% unallocated`}
            </p>
          </div>

          <Button
            variant="outline"
            fullWidth
            size="sm"
            className="mt-2 gap-1"
            onClick={() => router.push(ROUTES.RENTER_PAYMENTS)}
          >
            <span className="text-sm">₦</span>
            Split Payments
          </Button>
        </div>
      </motion.div>
    </>
  );
};
