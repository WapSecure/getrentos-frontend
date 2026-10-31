'use client';

import { useEffect, useId } from 'react';
import { useSearchParams } from 'next/navigation';
import { Gift } from 'lucide-react';
import { Input } from '@getrentos/ui';
import { useSignupStore } from '@/lib/store/signupStore';

/** Reads ?ref=CODE off the signup URL once, and lets the user edit/type a code manually too. */
export const ReferralCodeField = () => {
  const searchParams = useSearchParams();
  const { data, setData } = useSignupStore();
  const inputId = useId();

  useEffect(() => {
    const ref = searchParams.get('ref');
    if (ref && !data.referralCode) {
      setData({ referralCode: ref.toUpperCase() });
    }
    // Only meant to run once, off the URL present when the page first loads.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="relative">
      <label htmlFor={inputId} className="block text-sm font-medium text-foreground mb-1.5">
        Referral code <span className="text-muted-foreground font-normal">(optional)</span>
      </label>
      <div className="relative">
        <Gift
          className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground"
          aria-hidden="true"
        />
        <Input
          id={inputId}
          type="text"
          value={data.referralCode || ''}
          onChange={(e) => setData({ referralCode: e.target.value.toUpperCase() })}
          className="w-full pl-10 pr-4 py-3 border rounded-xl bg-card text-foreground focus:ring-2 focus:ring-primary focus:border-transparent transition-all border-border"
          placeholder="Have a friend's code?"
        />
      </div>
    </div>
  );
};
