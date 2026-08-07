'use client';

import { motion } from 'framer-motion';
import {
  Check,
  Home,
  Building2,
  TrendingUp,
  Search,
  Users,
  UserCheck,
  Shield,
  Briefcase,
} from 'lucide-react';
import { ROLES } from '@/lib/constants/auth';

const iconMap = {
  Home: Home,
  Building2: Building2,
  TrendingUp: TrendingUp,
  Search: Search,
  Users: Users,
  UserCheck: UserCheck,
  Shield: Shield,
  Briefcase: Briefcase,
};

interface RoleCardProps {
  role: (typeof ROLES)[keyof typeof ROLES];
  isSelected: boolean;
  onSelect: () => void;
  onDeselect: () => void;
  disabled?: boolean;
}

export const RoleCard = ({ role, isSelected, onSelect, onDeselect, disabled }: RoleCardProps) => {
  const Icon = iconMap[role.icon as keyof typeof iconMap];

  const handleClick = () => {
    if (disabled) return;
    if (isSelected) {
      onDeselect();
    } else {
      onSelect();
    }
  };

  return (
    <motion.button
      onClick={handleClick}
      whileHover={!disabled ? { scale: 1.02 } : {}}
      whileTap={!disabled ? { scale: 0.98 } : {}}
      className={`relative w-full p-6 rounded-2xl border-2 transition-all text-left ${
        disabled ? 'opacity-50 cursor-not-allowed' : ''
      } ${
        isSelected
          ? 'border-[#c4a747] bg-[#c4a747]/5 shadow-lg'
          : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-[#1a2a2f] hover:border-[#c4a747]/50'
      }`}
    >
      {isSelected && (
        <div className="absolute top-4 right-4">
          <div className="w-6 h-6 bg-[#c4a747] rounded-full flex items-center justify-center">
            <Check className="w-3 h-3 text-[#0a1a1f]" />
          </div>
        </div>
      )}

      <div
        className={`w-12 h-12 rounded-xl bg-gray-100 dark:bg-white/10 flex items-center justify-center mb-4 transition-colors ${
          isSelected ? 'bg-[#c4a747]/20' : ''
        }`}
      >
        <Icon
          className={`w-6 h-6 ${isSelected ? 'text-[#c4a747]' : 'text-gray-600 dark:text-gray-400'}`}
        />
      </div>

      <h3
        className={`text-lg font-semibold mb-1 ${isSelected ? 'text-[#c4a747]' : 'text-gray-900 dark:text-white'}`}
      >
        {role.name}
      </h3>
      <p className="text-sm text-gray-600 dark:text-gray-400">{role.description}</p>

      <div className="mt-3 flex flex-wrap gap-1">
        {role.requiresVerification.map((req) => (
          <span
            key={req}
            className="text-xs px-2 py-0.5 bg-gray-100 dark:bg-white/5 rounded-full text-gray-500 dark:text-gray-500"
          >
            {req === 'identity' && 'ID Verified'}
            {req === 'property' && 'Property Docs'}
            {req === 'license' && 'License'}
          </span>
        ))}
      </div>
    </motion.button>
  );
};
