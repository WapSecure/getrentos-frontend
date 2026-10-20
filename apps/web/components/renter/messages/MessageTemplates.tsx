'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { FileText, Plus, Edit2, Trash2, Copy, Check, ChevronDown, ChevronUp } from 'lucide-react';
import {
  Badge,
  Button,
  Card,
  Field,
  IconButton,
  Input,
  Select,
  Textarea,
  type BadgeVariant,
} from '@getrentos/ui';
import { renterService, type MessageTemplate } from '@/services/renterService';
import { unwrap } from '@/lib/apiHelpers';
import { renterKeys } from '@/lib/queryKeys';

interface MessageTemplatesProps {
  onSelectTemplate: (content: string) => void;
}

interface NewTemplateData {
  title: string;
  content: string;
  category: string;
}

const categoryLabels: Record<string, string> = {
  application: 'Application',
  viewing: 'Viewing',
  followup: 'Follow-up',
  general: 'General',
};

const categoryVariants: Record<string, BadgeVariant> = {
  application: 'info',
  viewing: 'success',
  followup: 'warning',
  general: 'neutral',
};

const categoryOptions = ['application', 'viewing', 'followup', 'general'].map((cat) => ({
  value: cat,
  label: categoryLabels[cat],
}));

export const MessageTemplates = ({ onSelectTemplate }: MessageTemplatesProps) => {
  const queryClient = useQueryClient();
  const [isExpanded, setIsExpanded] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [newTemplate, setNewTemplate] = useState<NewTemplateData>({
    title: '',
    content: '',
    category: 'general',
  });
  const [editTemplate, setEditTemplate] = useState<MessageTemplate | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const { data: templates = [] } = useQuery({
    queryKey: renterKeys.messageTemplates,
    queryFn: () => unwrap(renterService.listMessageTemplates()),
  });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: renterKeys.messageTemplates });

  const addMutation = useMutation({
    mutationFn: (data: NewTemplateData) => unwrap(renterService.createMessageTemplate(data)),
    onSuccess: () => {
      invalidate();
      setNewTemplate({ title: '', content: '', category: 'general' });
      setIsAdding(false);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: { title: string; content: string; category: string; useCount?: number };
    }) => unwrap(renterService.updateMessageTemplate(id, data)),
    onSuccess: () => {
      invalidate();
      setEditingId(null);
      setEditTemplate(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => unwrap(renterService.deleteMessageTemplate(id)),
    onSuccess: invalidate,
  });

  const handleAddTemplate = () => {
    if (!newTemplate.title || !newTemplate.content) return;
    addMutation.mutate(newTemplate);
  };

  const handleEditTemplate = (id: string) => {
    const template = templates.find((t) => t.id === id);
    if (template) {
      setEditTemplate(template);
      setEditingId(id);
    }
  };

  const handleSaveEdit = () => {
    if (!editTemplate) return;
    updateMutation.mutate({
      id: editTemplate.id,
      data: {
        title: editTemplate.title,
        content: editTemplate.content,
        category: editTemplate.category ?? 'general',
      },
    });
  };

  const handleDeleteTemplate = (id: string) => {
    deleteMutation.mutate(id);
  };

  const handleCopyTemplate = (content: string, id: string) => {
    navigator.clipboard.writeText(content);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleUseTemplate = (template: MessageTemplate) => {
    onSelectTemplate(template.content);
    updateMutation.mutate({
      id: template.id,
      data: {
        title: template.title,
        content: template.content,
        category: template.category ?? 'general',
        useCount: template.useCount + 1,
      },
    });
  };

  return (
    <Card>
      <div className="flex items-center justify-between gap-2 p-3">
        <button
          type="button"
          onClick={() => setIsExpanded(!isExpanded)}
          aria-expanded={isExpanded}
          className="flex min-w-0 flex-1 items-center gap-2 rounded-lg text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <FileText className="w-4 h-4 text-primary" />
          <span className="text-sm font-medium text-foreground">Message Templates</span>
          <span className="text-xs text-muted-foreground">({templates.length})</span>
        </button>
        <div className="flex items-center gap-1">
          <Button
            size="sm"
            variant="ghost"
            icon={<Plus className="w-3 h-3" />}
            onClick={() => {
              setIsAdding(!isAdding);
              setIsExpanded(true);
            }}
          >
            New
          </Button>
          <IconButton
            size="sm"
            label={isExpanded ? 'Collapse templates' : 'Expand templates'}
            aria-expanded={isExpanded}
            icon={isExpanded ? <ChevronUp /> : <ChevronDown />}
            onClick={() => setIsExpanded(!isExpanded)}
          />
        </div>
      </div>

      {isExpanded && (
        <div className="p-3 pt-0 space-y-3 max-h-96 overflow-y-auto">
          {isAdding && (
            <div className="p-3 rounded-lg bg-secondary/60 border border-border space-y-3">
              <Field label="Template name" required>
                <Input
                  type="text"
                  value={newTemplate.title}
                  onChange={(e) => setNewTemplate({ ...newTemplate, title: e.target.value })}
                  placeholder="Template name"
                />
              </Field>
              <Field label="Content" required>
                <Textarea
                  value={newTemplate.content}
                  onChange={(e) => setNewTemplate({ ...newTemplate, content: e.target.value })}
                  placeholder="Template content..."
                  rows={3}
                />
              </Field>
              <Field label="Category">
                <Select
                  value={newTemplate.category}
                  onValueChange={(category) => setNewTemplate({ ...newTemplate, category })}
                  options={categoryOptions}
                />
              </Field>
              <div className="flex flex-wrap gap-2">
                <Button
                  size="sm"
                  onClick={handleAddTemplate}
                  disabled={!newTemplate.title || !newTemplate.content}
                  isLoading={addMutation.isPending}
                >
                  Add Template
                </Button>
                <Button size="sm" variant="ghost" onClick={() => setIsAdding(false)}>
                  Cancel
                </Button>
              </div>
            </div>
          )}

          {templates.map((template) => (
            <div
              key={template.id}
              className="p-3 rounded-lg border border-border hover:border-primary transition-colors"
            >
              {editingId === template.id && editTemplate ? (
                <div className="space-y-3">
                  <Field label="Template name" required>
                    <Input
                      type="text"
                      value={editTemplate.title}
                      onChange={(e) => setEditTemplate({ ...editTemplate, title: e.target.value })}
                    />
                  </Field>
                  <Field label="Content" required>
                    <Textarea
                      value={editTemplate.content}
                      onChange={(e) =>
                        setEditTemplate({ ...editTemplate, content: e.target.value })
                      }
                      rows={3}
                    />
                  </Field>
                  <Field label="Category">
                    <Select
                      value={editTemplate.category ?? 'general'}
                      onValueChange={(category) => setEditTemplate({ ...editTemplate, category })}
                      options={categoryOptions}
                    />
                  </Field>
                  <div className="flex flex-wrap gap-2">
                    <Button size="sm" onClick={handleSaveEdit} isLoading={updateMutation.isPending}>
                      Save
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => setEditingId(null)}>
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h4 className="font-medium text-foreground">{template.title}</h4>
                        <Badge variant={categoryVariants[template.category ?? 'general']}>
                          {categoryLabels[template.category ?? 'general']}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                        {template.content}
                      </p>
                      <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                        <span>Used {template.useCount} times</span>
                      </div>
                    </div>
                    <div className="flex shrink-0 gap-1">
                      <IconButton
                        size="sm"
                        label="Use template"
                        title="Use template"
                        icon={<Check className="text-success" />}
                        onClick={() => handleUseTemplate(template)}
                      />
                      <IconButton
                        size="sm"
                        label="Copy template"
                        title="Copy template"
                        icon={
                          copiedId === template.id ? <Check className="text-success" /> : <Copy />
                        }
                        onClick={() => handleCopyTemplate(template.content, template.id)}
                      />
                      <IconButton
                        size="sm"
                        label="Edit template"
                        title="Edit template"
                        icon={<Edit2 />}
                        onClick={() => handleEditTemplate(template.id)}
                      />
                      <IconButton
                        size="sm"
                        variant="danger"
                        label="Delete template"
                        title="Delete template"
                        icon={<Trash2 />}
                        isLoading={
                          deleteMutation.isPending && deleteMutation.variables === template.id
                        }
                        onClick={() => handleDeleteTemplate(template.id)}
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </Card>
  );
};
