import { MessageCircle, Phone } from 'lucide-react';
import { SUPPORT, hasSupportLine, whatsappLink } from '@/lib/support';
import { cn } from '@sureground/shared';

export function SupportContact({
  lead = 'Need help? Talk to Sureground support:',
  context,
  className,
}: {
  lead?: string;
  context?: string;
  className?: string;
}) {
  if (!hasSupportLine()) return null;
  return (
    <div className={cn('text-xs text-muted-foreground', className)}>
      <p>{lead}</p>
      <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1">
        {SUPPORT.phone && (
          <a
            href={`tel:${SUPPORT.phone.replace(/\s/g, '')}`}
            className="inline-flex items-center gap-1 font-medium text-primary hover:underline"
          >
            <Phone className="h-3.5 w-3.5" /> Call {SUPPORT.phone}
          </a>
        )}
        {SUPPORT.whatsapp && (
          <a
            href={whatsappLink(SUPPORT.whatsapp, context)}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1 font-medium text-primary hover:underline"
          >
            <MessageCircle className="h-3.5 w-3.5" /> WhatsApp us
          </a>
        )}
      </div>
      {SUPPORT.hours && <p className="mt-0.5">{SUPPORT.hours}</p>}
    </div>
  );
}
