import type { HTMLAttributes } from 'react';
import { cn } from './cn';

export interface CardProps extends HTMLAttributes<HTMLElement> {
  as?: 'div' | 'section' | 'aside' | 'article' | 'li';
  tone?: 'default' | 'warm';
}

export function Card({
  as: Tag = 'div',
  tone = 'default',
  className,
  ...rest
}: CardProps) {
  return (
    <Tag
      className={cn(
        'rounded-xl border border-line',
        tone === 'warm' ? 'bg-surface-warm' : 'bg-surface',
        className,
      )}
      {...rest}
    />
  );
}
