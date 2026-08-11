'use client';

import { HelpCenterContent } from '@/components/shared/help/HelpCenterContent';

export default function AdminHelpPage() {
  return <HelpCenterContent roleLabel="Admin" messagesHref="/admin/messages" />;
}
