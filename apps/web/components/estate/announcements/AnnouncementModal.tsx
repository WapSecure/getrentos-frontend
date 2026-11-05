'use client';

import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Sparkles } from 'lucide-react';
import {
  Alert,
  Button,
  Checkbox,
  Dialog,
  DialogContent,
  DialogTitle,
  Field,
  Input,
  Select,
  Textarea,
} from '@getrentos/ui';
import { unwrap } from '@/lib/apiHelpers';
import { REPLY_LANGUAGES, type ReplyLanguage } from '@/lib/replyLanguage';
import { estateService } from '@/services/estateService';
import type { Announcement } from '@/types/estate';

interface AnnouncementModalProps {
  /** For "Write it for me": drafts from the manager's notes. */
  estateId?: string;
  /** Notes to start from, e.g. a shared problem from the reports digest. */
  initialNotes?: string;
  isOpen: boolean;
  announcement: Announcement | null;
  onClose: () => void;
  onSubmit: (data: {
    title: string;
    body: string;
    priority: 'NORMAL' | 'URGENT';
    deliveryChannels?: ('SMS' | 'WHATSAPP')[];
  }) => void;
  isSubmitting?: boolean;
}

const priorityOptions = [
  { value: 'NORMAL', label: 'Normal' },
  { value: 'URGENT', label: 'Urgent' },
];

export const AnnouncementModal = ({
  estateId,
  initialNotes = '',
  isOpen,
  announcement,
  onClose,
  onSubmit,
  isSubmitting,
}: AnnouncementModalProps) => {
  const [title, setTitle] = useState(announcement?.title ?? '');
  const [body, setBody] = useState(announcement?.body ?? '');
  const [priority, setPriority] = useState(
    announcement ? announcement.priority.toUpperCase() : 'NORMAL'
  );
  const [notes, setNotes] = useState(initialNotes);
  const [language, setLanguage] = useState<ReplyLanguage>('en');
  const draft = useMutation({
    mutationFn: () => unwrap(estateService.draftAnnouncement(estateId!, notes.trim(), language)),
    onSuccess: (d) => {
      setTitle(d.title);
      setBody(d.body);
      setPriority(d.priority);
    },
  });
  const [sendSms, setSendSms] = useState(false);
  const [sendWhatsApp, setSendWhatsApp] = useState(false);

  const handleClose = () => {
    setSendSms(false);
    setSendWhatsApp(false);
    onClose();
  };

  const canSubmit = title.trim().length > 0 && body.trim().length > 0;

  return (
    <Dialog open={isOpen} onOpenChange={(next) => !next && handleClose()}>
      <DialogContent size="md">
        <DialogTitle className="text-lg font-semibold text-foreground">
          {announcement ? 'Edit Announcement' : 'New Announcement'}
        </DialogTitle>

        <div className="mt-4 space-y-4">
          {!announcement && estateId && (
            <div className="space-y-2 rounded-lg border border-border p-3">
              <Field
                label="Write it for me"
                hint="Say what is happening and what residents should do. You can edit the draft before posting."
              >
                <Textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                  placeholder="e.g. Pump broken in Block C, vendor fixing it tomorrow morning, store water tonight"
                />
              </Field>
              <div className="flex flex-wrap items-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  icon={<Sparkles className="h-4 w-4" aria-hidden />}
                  disabled={notes.trim().length < 5}
                  isLoading={draft.isPending}
                  loadingText="Drafting…"
                  onClick={() => draft.mutate()}
                >
                  Draft announcement
                </Button>
                <span className="ml-auto flex items-center gap-2 text-xs text-muted-foreground">
                  <span aria-hidden="true">Write in</span>
                  <Select
                    value={language}
                    onValueChange={(value) => setLanguage(value as ReplyLanguage)}
                    options={REPLY_LANGUAGES.map((l) => ({ value: l.value, label: l.label }))}
                    ariaLabel="Announcement language"
                    controlSize="sm"
                    searchable={false}
                    className="w-32"
                  />
                </span>
              </div>
              {draft.isError && (
                <Alert variant="danger">
                  {draft.error.message || 'Could not draft it. Try again.'}
                </Alert>
              )}
            </div>
          )}

          <Field label="Title" required>
            <Input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Water outage this weekend"
            />
          </Field>

          <Field label="Message" required>
            <Textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              rows={5}
              placeholder="Details for residents…"
            />
          </Field>

          <Field label="Priority">
            <Select value={priority} onValueChange={setPriority} options={priorityOptions} />
          </Field>

          {!announcement && (
            <fieldset>
              <legend className="block text-sm font-medium text-foreground mb-2">
                Also deliver via{' '}
                <span className="text-muted-foreground font-normal">(optional)</span>
              </legend>
              <div className="flex flex-wrap gap-4">
                <Checkbox checked={sendSms} onCheckedChange={setSendSms} label="SMS" />
                <Checkbox
                  checked={sendWhatsApp}
                  onCheckedChange={setSendWhatsApp}
                  label="WhatsApp"
                />
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Residents always get an in-app notification. These add SMS/WhatsApp to households
                with a phone number on file.
              </p>
            </fieldset>
          )}
        </div>

        <div className="mt-6 flex flex-wrap justify-end gap-2">
          <Button variant="ghost" onClick={handleClose}>
            Cancel
          </Button>
          <Button
            variant="primary"
            disabled={!canSubmit}
            isLoading={isSubmitting}
            loadingText="Saving…"
            onClick={() => {
              const deliveryChannels: ('SMS' | 'WHATSAPP')[] = [];
              if (sendSms) deliveryChannels.push('SMS');
              if (sendWhatsApp) deliveryChannels.push('WHATSAPP');
              onSubmit({
                title: title.trim(),
                body: body.trim(),
                priority: priority as 'NORMAL' | 'URGENT',
                ...(deliveryChannels.length > 0 ? { deliveryChannels } : {}),
              });
            }}
          >
            {announcement ? 'Save Changes' : 'Post Announcement'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
