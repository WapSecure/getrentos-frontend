'use client';

import { LegacyInput } from '@getrentos/ui';

import { useState } from 'react';
import {
  Folder,
  FolderOpen,
  FileText,
  Receipt,
  ClipboardCheck,
  Shield,
  Plus,
  X,
} from 'lucide-react';
import { Button } from '@getrentos/ui';

interface DocumentCategoriesProps {
  categories: Record<string, number>;
  total: number;
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
  Miscellaneous: 'text-muted-foreground',
};

export const DocumentCategories = ({
  categories,
  total,
  selectedCategory,
  onSelectCategory,
}: DocumentCategoriesProps) => {
  const [isAddingCategory, setIsAddingCategory] = useState(false);
  const [newCategory, setNewCategory] = useState('');

  const categoryList = Object.keys(categories).sort();

  const handleAddCategory = () => {
    if (!newCategory.trim()) return;
    console.log('Adding category:', newCategory);
    setNewCategory('');
    setIsAddingCategory(false);
  };

  return (
    <div className="bg-card rounded-xl border border-border overflow-hidden">
      <div className="p-4 border-b border-border">
        <div className="flex items-center gap-2">
          <Folder className="w-4 h-4 text-primary" />
          <h3 className="font-semibold text-foreground">Categories</h3>
        </div>
        <p className="text-xs text-muted-foreground mt-0.5">{categoryList.length} categories</p>
      </div>

      <div className="p-2 space-y-1 max-h-96 overflow-y-auto">
        <button
          onClick={() => onSelectCategory('all')}
          className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-colors ${
            selectedCategory === 'all'
              ? 'bg-accent text-primary'
              : 'hover:bg-secondary text-foreground'
          }`}
        >
          <div className="flex items-center gap-2">
            <FolderOpen className="w-4 h-4" />
            <span>All Documents</span>
          </div>
          <span className="text-xs text-gray-500">{total}</span>
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
                  ? 'bg-accent text-primary'
                  : 'hover:bg-secondary text-foreground'
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
          <div className="mt-2 p-2 border-t border-border">
            <div className="flex gap-2">
              <LegacyInput
                type="text"
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value)}
                placeholder="Category name"
                className="flex-1 px-3 py-1.5 text-sm rounded-lg border border-border bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
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
