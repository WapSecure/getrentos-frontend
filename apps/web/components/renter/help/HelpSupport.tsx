'use client';

import { MessageCircle, Mail, Clock, ArrowRight, LifeBuoy } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Button, Card } from '@getrentos/ui';
import { ROUTES } from '@/lib/constants/auth';
import { SUPPORT } from '@/lib/support';

export const HelpSupport = () => {
  const router = useRouter();

  return (
    <Card>
      <div className="p-4 border-b border-border">
        <h3 className="font-semibold text-foreground">Contact Support</h3>
        <p className="text-xs text-muted-foreground mt-0.5">We&apos;re here to help</p>
      </div>

      <div className="p-4 space-y-4">
        <div className="flex items-start gap-3 rounded-lg border border-info/20 bg-info-subtle p-3">
          <div className="rounded-lg bg-card p-2">
            <MessageCircle className="h-5 w-5 text-info" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-foreground">Live Chat</p>
            <p className="text-xs text-muted-foreground">Message us anytime</p>
            <Button
              variant="primary"
              size="sm"
              className="mt-2"
              onClick={() => router.push(ROUTES.RENTER_MESSAGES)}
              icon={<ArrowRight className="h-3 w-3" />}
              iconPosition="right"
            >
              Start Chat
            </Button>
          </div>
        </div>

        <div className="flex items-start gap-3 rounded-lg border border-success/20 bg-success-subtle p-3">
          <div className="rounded-lg bg-card p-2">
            <LifeBuoy className="h-5 w-5 text-success" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-foreground">Support tickets</p>
            <p className="text-xs text-muted-foreground">
              Start or track a conversation with the team
            </p>
            <Button
              variant="secondary"
              size="sm"
              className="mt-2"
              onClick={() => router.push('/renter/support')}
              icon={<ArrowRight className="h-3 w-3" />}
              iconPosition="right"
            >
              Open Support
            </Button>
          </div>
        </div>

        <div className="flex items-start gap-3 rounded-lg bg-secondary p-3">
          <div className="rounded-lg bg-card p-2">
            <Mail className="h-5 w-5 text-muted-foreground" />
          </div>
          <div>
            <p className="text-sm font-medium text-foreground">Email Support</p>
            <a href={`mailto:${SUPPORT.email}`} className="text-xs text-primary">
              {SUPPORT.email}
            </a>
            <p className="text-xs text-muted-foreground">We reply to every message</p>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Clock className="w-3 h-3" />
          <span>Reach out via chat or email and we&apos;ll respond promptly</span>
        </div>
      </div>
    </Card>
  );
};
