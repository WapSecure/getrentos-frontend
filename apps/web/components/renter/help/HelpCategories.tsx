'use client';

import {
  Home,
  CreditCard,
  Wrench,
  FileText,
  MessageCircle,
  Users,
  Settings,
  Shield,
} from 'lucide-react';

interface Category {
  id: string;
  name: string;
  icon: React.ElementType;
  count: number;
}

const categories: Category[] = [
  { id: 'all', name: 'All Topics', icon: Home, count: 0 },
  { id: 'getting-started', name: 'Getting Started', icon: Users, count: 12 },
  { id: 'renting', name: 'Renting', icon: Home, count: 8 },
  { id: 'payments', name: 'Payments & Escrow', icon: CreditCard, count: 10 },
  { id: 'maintenance', name: 'Maintenance', icon: Wrench, count: 6 },
  { id: 'documents', name: 'Documents', icon: FileText, count: 7 },
  { id: 'messages', name: 'Messages', icon: MessageCircle, count: 5 },
  { id: 'account', name: 'Account Settings', icon: Settings, count: 9 },
  { id: 'security', name: 'Security & Trust', icon: Shield, count: 4 },
];

interface HelpCategoriesProps {
  selectedCategory: string;
  onSelectCategory: (category: string) => void;
}

export const HelpCategories = ({ selectedCategory, onSelectCategory }: HelpCategoriesProps) => {
  return (
    <div className="bg-white dark:bg-[#1a2a2f] rounded-xl border border-gray-200 dark:border-white/10 overflow-hidden">
      <div className="p-4 border-b border-gray-200 dark:border-white/10">
        <h3 className="font-semibold text-gray-900 dark:text-white">Categories</h3>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Browse by topic</p>
      </div>

      <div className="p-2">
        <div className="grid grid-cols-2 gap-1">
          {categories.map((category) => {
            const Icon = category.icon;
            const isSelected = selectedCategory === category.id;
            return (
              <button
                key={category.id}
                onClick={() => onSelectCategory(category.id)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
                  isSelected
                    ? 'bg-[#c4a747]/10 text-[#c4a747]'
                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/5'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span className="flex-1 text-left">{category.name}</span>
                {category.count > 0 && (
                  <span className="text-xs text-gray-500">{category.count}</span>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
