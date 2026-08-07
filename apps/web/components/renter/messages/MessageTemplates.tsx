'use client';

import { useState } from 'react';
import { FileText, Plus, Edit2, Trash2, Copy, Check, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/Button';

type TemplateCategory = 'application' | 'viewing' | 'followup' | 'general';

interface Template {
  id: string;
  name: string;
  content: string;
  category: TemplateCategory;
  useCount: number;
}

interface MessageTemplatesProps {
  onSelectTemplate: (content: string) => void;
}

interface NewTemplateData {
  name: string;
  content: string;
  category: TemplateCategory;
}

const defaultTemplates: Template[] = [
  {
    id: '1',
    name: 'Application Follow-up',
    content:
      'Hi, I submitted an application for this property and wanted to follow up on the status. Please let me know if you need any additional information.',
    category: 'application',
    useCount: 12,
  },
  {
    id: '2',
    name: 'Schedule Viewing',
    content:
      "Hi, I'm very interested in this property. Could we schedule a viewing at your earliest convenience? I'm available on [day/time]. Please let me know what works for you.",
    category: 'viewing',
    useCount: 8,
  },
  {
    id: '3',
    name: 'Availability Inquiry',
    content:
      "Hi, is this property still available? I've been looking for something like this and would love to schedule a viewing if it's still on the market.",
    category: 'general',
    useCount: 15,
  },
  {
    id: '4',
    name: 'Thank You for Viewing',
    content:
      'Thank you for the viewing today! I really liked the property and would like to proceed with the application. Could you please send me the application link?',
    category: 'viewing',
    useCount: 5,
  },
];

const categoryLabels: Record<TemplateCategory, string> = {
  application: 'Application',
  viewing: 'Viewing',
  followup: 'Follow-up',
  general: 'General',
};

const categoryColors: Record<TemplateCategory, string> = {
  application: 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400',
  viewing: 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400',
  followup: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400',
  general: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300',
};

const categoryOptions: TemplateCategory[] = ['application', 'viewing', 'followup', 'general'];

export const MessageTemplates = ({ onSelectTemplate }: MessageTemplatesProps) => {
  const [templates, setTemplates] = useState<Template[]>(defaultTemplates);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [newTemplate, setNewTemplate] = useState<NewTemplateData>({
    name: '',
    content: '',
    category: 'general',
  });
  const [editTemplate, setEditTemplate] = useState<Template | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleAddTemplate = () => {
    if (!newTemplate.name || !newTemplate.content) return;
    const template: Template = {
      id: Date.now().toString(),
      ...newTemplate,
      useCount: 0,
    };
    setTemplates([template, ...templates]);
    setNewTemplate({ name: '', content: '', category: 'general' });
    setIsAdding(false);
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
    setTemplates(templates.map((t) => (t.id === editTemplate.id ? editTemplate : t)));
    setEditingId(null);
    setEditTemplate(null);
  };

  const handleDeleteTemplate = (id: string) => {
    setTemplates(templates.filter((t) => t.id !== id));
  };

  const handleCopyTemplate = (content: string, id: string) => {
    navigator.clipboard.writeText(content);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleUseTemplate = (content: string) => {
    onSelectTemplate(content);
    setTemplates(
      templates.map((t) => (t.content === content ? { ...t, useCount: t.useCount + 1 } : t))
    );
  };

  const handleCategoryChange = (value: string): TemplateCategory => {
    return value as TemplateCategory;
  };

  return (
    <div className="bg-white dark:bg-[#1a2a2f] rounded-xl border border-gray-200 dark:border-white/10 overflow-hidden">
      <div
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full p-3 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-white/5 transition-colors cursor-pointer"
      >
        <div className="flex items-center gap-2">
          <FileText className="w-4 h-4 text-[#c4a747]" />
          <span className="text-sm font-medium text-gray-900 dark:text-white">
            Message Templates
          </span>
          <span className="text-xs text-gray-500">({templates.length})</span>
        </div>
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="ghost"
            className="gap-1"
            onClick={() => setIsAdding(!isAdding)}
          >
            <Plus className="w-3 h-3" />
            New
          </Button>
          {isExpanded ? (
            <ChevronUp className="w-4 h-4 text-gray-500" />
          ) : (
            <ChevronDown className="w-4 h-4 text-gray-500" />
          )}
        </div>
      </div>

      {isExpanded && (
        <div className="p-3 pt-0 space-y-3 max-h-96 overflow-y-auto">
          {isAdding && (
            <div className="p-3 rounded-lg bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-gray-700 space-y-3">
              <input
                type="text"
                value={newTemplate.name}
                onChange={(e) => setNewTemplate({ ...newTemplate, name: e.target.value })}
                placeholder="Template name"
                className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#1a2a2f] text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#c4a747]"
              />
              <textarea
                value={newTemplate.content}
                onChange={(e) => setNewTemplate({ ...newTemplate, content: e.target.value })}
                placeholder="Template content..."
                rows={3}
                className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#1a2a2f] text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#c4a747]"
              />
              <select
                value={newTemplate.category}
                onChange={(e) =>
                  setNewTemplate({ ...newTemplate, category: handleCategoryChange(e.target.value) })
                }
                className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#1a2a2f] text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#c4a747]"
              >
                {categoryOptions.map((cat) => (
                  <option key={cat} value={cat}>
                    {categoryLabels[cat]}
                  </option>
                ))}
              </select>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  onClick={handleAddTemplate}
                  disabled={!newTemplate.name || !newTemplate.content}
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
              className="p-3 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-[#c4a747] transition-colors"
            >
              {editingId === template.id && editTemplate ? (
                <div className="space-y-3">
                  <input
                    type="text"
                    value={editTemplate.name}
                    onChange={(e) => setEditTemplate({ ...editTemplate, name: e.target.value })}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#1a2a2f] text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#c4a747]"
                  />
                  <textarea
                    value={editTemplate.content}
                    onChange={(e) => setEditTemplate({ ...editTemplate, content: e.target.value })}
                    rows={3}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#1a2a2f] text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#c4a747]"
                  />
                  <select
                    value={editTemplate.category}
                    onChange={(e) =>
                      setEditTemplate({
                        ...editTemplate,
                        category: handleCategoryChange(e.target.value),
                      })
                    }
                    className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#1a2a2f] text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#c4a747]"
                  >
                    {categoryOptions.map((cat) => (
                      <option key={cat} value={cat}>
                        {categoryLabels[cat]}
                      </option>
                    ))}
                  </select>
                  <div className="flex gap-2">
                    <Button size="sm" onClick={handleSaveEdit}>
                      Save
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => setEditingId(null)}>
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                <div>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h4 className="font-medium text-gray-900 dark:text-white">
                          {template.name}
                        </h4>
                        <span
                          className={`text-xs px-2 py-0.5 rounded-full ${categoryColors[template.category]}`}
                        >
                          {categoryLabels[template.category]}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 line-clamp-2">
                        {template.content}
                      </p>
                      <div className="flex items-center gap-3 mt-2 text-xs text-gray-500">
                        <span>Used {template.useCount} times</span>
                      </div>
                    </div>
                    <div className="flex gap-1 ml-2">
                      <button
                        onClick={() => handleUseTemplate(template.content)}
                        className="p-1 rounded hover:bg-gray-100 dark:hover:bg-white/10"
                        title="Use template"
                      >
                        <Check className="w-3 h-3 text-green-500" />
                      </button>
                      <button
                        onClick={() => handleCopyTemplate(template.content, template.id)}
                        className="p-1 rounded hover:bg-gray-100 dark:hover:bg-white/10"
                        title="Copy template"
                      >
                        {copiedId === template.id ? (
                          <Check className="w-3 h-3 text-green-500" />
                        ) : (
                          <Copy className="w-3 h-3" />
                        )}
                      </button>
                      <button
                        onClick={() => handleEditTemplate(template.id)}
                        className="p-1 rounded hover:bg-gray-100 dark:hover:bg-white/10"
                        title="Edit template"
                      >
                        <Edit2 className="w-3 h-3 text-blue-500" />
                      </button>
                      <button
                        onClick={() => handleDeleteTemplate(template.id)}
                        className="p-1 rounded hover:bg-red-100 dark:hover:bg-red-900/20"
                        title="Delete template"
                      >
                        <Trash2 className="w-3 h-3 text-red-500" />
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
