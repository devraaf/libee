import type { ReactNode } from 'react';
import { cn } from '../../../shared/components/ui/cn';

interface SectionHeadingProps {
  eyebrow: string;
  title: string;
  description?: ReactNode;
  align?: 'left' | 'center';
}

export function SectionHeading({
  eyebrow,
  title,
  description,
  align = 'left',
}: SectionHeadingProps) {
  const centered = align === 'center';

  return (
    <div className={cn('max-w-2xl', centered && 'mx-auto text-center')}>
      <p className="type-label mb-3 text-primary uppercase">{eyebrow}</p>
      <h2 className="type-h2 text-fg">{title}</h2>
      {description && <div className="mt-5 text-muted">{description}</div>}
    </div>
  );
}
