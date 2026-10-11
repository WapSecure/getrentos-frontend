'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { FileText, Pencil, Trash2 } from 'lucide-react';
import {
  Button,
  Card,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
  EmptyState,
  Field,
  Input,
  Textarea,
  Toast,
  type ToastVariant,
} from '@getrentos/ui';
import { unwrap } from '@/lib/apiHelpers';
import { landlordKeys } from '@/lib/queryKeys';
import { automationService, type AnnouncementTemplate } from '@/services/automationService';
import { MERGE_FIELDS } from './constants';

export function TemplatesManager() {
  const queryClient = useQueryClient();
  const [toast, setToast] = useState<{ message: string; variant: ToastVariant } | null>(null);
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');

  const { data: templates = [], isLoading } = useQuery({
    queryKey: landlordKeys.announcementTemplates,
    queryFn: () => unwrap(automationService.listTemplates()),
  });

  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: landlordKeys.announcementTemplates });

  const save = useMutation({
    mutationFn: () =>
      editingId
        ? unwrap(automationService.updateTemplate(editingId, { title, content }))
        : unwrap(automationService.createTemplate({ title, content })),
    onSuccess: () => {
      invalidate();
      setOpen(false);
      setToast({
        message: editingId ? 'Template updated.' : 'Template saved.',
        variant: 'success',
      });
    },
    onError: (e: Error) => setToast({ message: e.message || 'Unable to save.', variant: 'error' }),
  });

  const remove = useMutation({
    mutationFn: (id: string) => unwrap(automationService.deleteTemplate(id)),
    onSuccess: () => {
      invalidate();
      setToast({ message: 'Template deleted.', variant: 'success' });
    },
    onError: (e: Error) =>
      setToast({ message: e.message || 'Unable to delete.', variant: 'error' }),
  });

  const openCreate = () => {
    setEditingId(null);
    setTitle('');
    setContent('');
    setOpen(true);
  };
  const openEdit = (t: AnnouncementTemplate) => {
    setEditingId(t.id);
    setTitle(t.title);
    setContent(t.content);
    setOpen(true);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-semibold text-foreground">Templates</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Reusable messages you can send as a broadcast or attach to an automation.
          </p>
        </div>
        <Button onClick={openCreate}>New template</Button>
      </div>

      {isLoading ? (
        <div className="h-24 animate-pulse rounded-2xl bg-secondary/50" />
      ) : templates.length === 0 ? (
        <Card static className="p-2">
          <EmptyState
            icon={FileText}
            title="No templates yet"
            description="Save a message once and reuse it for reminders, notices and announcements."
          />
        </Card>
      ) : (
        <div className="space-y-3">
          {templates.map((t) => (
            <Card key={t.id} static className="p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h3 className="font-semibold text-foreground">{t.title}</h3>
                  <p className="mt-1 whitespace-pre-wrap text-sm text-muted-foreground">
                    {t.content}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    rounded="md"
                    icon={<Pencil className="h-4 w-4" />}
                    onClick={() => openEdit(t)}
                  >
                    Edit
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    rounded="md"
                    icon={<Trash2 className="h-4 w-4" />}
                    onClick={() => remove.mutate(t.id)}
                    disabled={remove.isPending}
                  >
                    Delete
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg p-6">
          <DialogTitle className="text-lg font-semibold text-foreground">
            {editingId ? 'Edit template' : 'New template'}
          </DialogTitle>
          <DialogDescription className="mt-1 text-sm text-muted-foreground">
            Use merge fields so each tenant sees their own details.
          </DialogDescription>
          <div className="mt-5 space-y-4">
            <Field label="Title">
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Rent reminder"
              />
            </Field>
            <Field label="Message" hint={`Merge fields: ${MERGE_FIELDS.join(', ')}`}>
              <Textarea value={content} onChange={(e) => setContent(e.target.value)} rows={5} />
            </Field>
          </div>
          <div className="mt-6 flex justify-end gap-3">
            <Button variant="outline" rounded="md" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button
              rounded="md"
              onClick={() => save.mutate()}
              disabled={!title.trim() || !content.trim() || save.isPending}
            >
              {save.isPending ? 'Saving…' : 'Save template'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {toast && (
        <Toast message={toast.message} variant={toast.variant} onClose={() => setToast(null)} />
      )}
    </div>
  );
}
