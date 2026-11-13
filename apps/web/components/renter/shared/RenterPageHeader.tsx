import type { ElementType, ReactNode } from 'react';
import { PageHeader } from '@sureground/ui';
import { RecordIconTile } from '@/components/shared/records/RecordParts';

interface RenterPageHeaderProps {
  eyebrow?: string;
  title: ReactNode;
  description: ReactNode;
  icon?: ElementType;
  actions?: ReactNode;
  children?: ReactNode;
}

export function RenterPageHeader({
  eyebrow = 'Renter workspace',
  title,
  description,
  icon: Icon,
  actions,
  children,
}: RenterPageHeaderProps) {
  return (
    <PageHeader
      eyebrow={eyebrow}
      title={
        Icon ? (
          <span className="flex items-center gap-3">
            <RecordIconTile icon={Icon} />
            {title}
          </span>
        ) : (
          title
        )
      }
      description={description}
      actions={actions}
      meta={children}
    />
  );
}
