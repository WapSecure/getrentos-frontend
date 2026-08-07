'use client';

import { useState } from 'react';
import {
  Folder,
  FolderOpen,
  FileText,
  Receipt,
  ClipboardCheck,
  Shield,
  Plus,
  Tag,
  X,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';

interface Document {
  id: string;
  category: string;
  tags?: string[];
}

interface DocumentCategoriesProps {
  documents: Document[];
  selectedCategory: string;
  onSelectCategory: (category: string) => void;
}

const categoryIcons: Record<string, React.ElementType> = {
  'Lease Agreements': FileText,
  Receipts: Receipt,
  'Inspection Reports': ClipboardCheck,
  Insurance: Shield,
  Miscellaneous: FileText,
};

const categoryColors: Record<string, string> = {
  'Lease Agreements': 'text-blue-600 dark:text-blue-400',
  Receipts: 'text-green-600 dark:text-green-400',
  'Inspection Reports': 'text-purple-600 dark:text-purple-400',
  Insurance: 'text-orange-600 dark:text-orange-400',
  Miscellaneous: 'text-gray-600 dark:text-gray-400',
};

export const DocumentCategories = ({
  documents,
  selectedCategory,
  onSelectCategory,
}: DocumentCategoriesProps) => {
  const [isAddingCategory, setIsAddingCategory] = useState(false);
  const [newCategory, setNewCategory] = useState('');

  const categories = documents.reduce<Record<string, number>>((acc, doc) => {
    acc[doc.category] = (acc[doc.category] || 0) + 1;
    return acc;
  }, {});

  const categoryList = Object.keys(categories).sort();

  const handleAddCategory = () => {
    if (!newCategory.trim()) return;
    console.log('Adding category:', newCategory);
    setNewCategory('');
    setIsAddingCategory(false);
  };

  return (
    <div className="bg-white dark:bg-[#1a2a2f] rounded-xl border border-gray-200 dark:border-white/10 overflow-hidden">
      <div className="p-4 border-b border-gray-200 dark:border-white/10">
        <div className="flex items-center gap-2">
          <Folder className="w-4 h-4 text-[#c4a747]" />
          <h3 className="font-semibold text-gray-900 dark:text-white">Categories</h3>
        </div>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
          {categoryList.length} categories
        </p>
      </div>

      <div className="p-2 space-y-1 max-h-96 overflow-y-auto">
        <button
          onClick={() => onSelectCategory('all')}
          className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-colors ${
            selectedCategory === 'all'
              ? 'bg-[#c4a747]/10 text-[#c4a747]'
              : 'hover:bg-gray-50 dark:hover:bg-white/5 text-gray-700 dark:text-gray-300'
          }`}
        >
          <div className="flex items-center gap-2">
            <FolderOpen className="w-4 h-4" />
            <span>All Documents</span>
          </div>
          <span className="text-xs text-gray-500">{documents.length}</span>
        </button>

        {categoryList.map((category) => {
          const Icon = categoryIcons[category] || FileText;
          const color = categoryColors[category] || 'text-gray-600';

          return (
            <button
              key={category}
              onClick={() => onSelectCategory(category)}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-colors ${
                selectedCategory === category
                  ? 'bg-[#c4a747]/10 text-[#c4a747]'
                  : 'hover:bg-gray-50 dark:hover:bg-white/5 text-gray-700 dark:text-gray-300'
              }`}
            >
              <div className="flex items-center gap-2">
                <Icon className={`w-4 h-4 ${color}`} />
                <span>{category}</span>
              </div>
              <span className="text-xs text-gray-500">{categories[category]}</span>
            </button>
          );
        })}

        {isAddingCategory ? (
          <div className="mt-2 p-2 border-t border-gray-200 dark:border-white/10">
            <div className="flex gap-2">
              <input
                type="text"
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value)}
                placeholder="Category name"
                className="flex-1 px-3 py-1.5 text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#1a2a2f] text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#c4a747]"
              />
              <Button size="sm" onClick={handleAddCategory} disabled={!newCategory.trim()}>
                Add
              </Button>
              <Button size="sm" variant="ghost" onClick={() => setIsAddingCategory(false)}>
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>
        ) : (
          <Button
            variant="ghost"
            size="sm"
            fullWidth
            className="gap-1 mt-2"
            onClick={() => setIsAddingCategory(true)}
          >
            <Plus className="w-3 h-3" />
            New Category
          </Button>
        )}
      </div>
    </div>
  );
};
