'use client';

import { useState } from 'react';
import { Check } from 'lucide-react';
import { Button } from './Button';

interface SaveButtonProps {
  label?: string;
  type?: 'button' | 'submit';
  fullWidth?: boolean;
  className?: string;
  onClick?: () => void;
}

export const SaveButton = ({
  label = 'Save Changes',
  type = 'button',
  fullWidth,
  className,
  onClick,
}: SaveButtonProps) => {
  const [saved, setSaved] = useState(false);

  const handleClick = () => {
    onClick?.();
    setSaved(true);
    window.setTimeout(() => setSaved(false), 2000);
  };

  return (
    <Button
      type={type}
      variant="primary"
      fullWidth={fullWidth}
      className={className ? `gap-1.5 ${className}` : 'gap-1.5'}
      onClick={handleClick}
    >
      {saved && <Check className="w-4 h-4" />}
      {saved ? 'Saved' : label}
    </Button>
  );
};
