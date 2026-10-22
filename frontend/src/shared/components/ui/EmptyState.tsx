import type { ReactNode } from 'react';
import { cn } from './cn';

export interface EmptyStateProps {
  title: string;
  description?: string;
  icon?: ReactNode;
  action?: ReactNode;
  className?: string;
}

export function EmptyState({
  title,
  description,
  icon,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center gap-3 px-6 py-12 text-center',
        className,
      )}
    >
      {icon && (
        <span
          aria-hidden="true"
          className="flex size-12 items-center justify-center rounded-full bg-chip text-muted"
        >
          {icon}
        </span>
      )}
      <p className="type-h4 text-fg">{title}</p>
      {description && (
        <p className="type-small max-w-sm text-muted">{description}</p>
      )}
      {action}
    </div>
  );
}
