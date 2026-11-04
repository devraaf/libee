import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { cn } from './cn';

export interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  /** Texto acessível, obrigatório porque o botão não tem texto visível. */
  label: string;
  icon: ReactNode;
  variant?: 'ghost' | 'outline' | 'table';
  size?: 'sm' | 'md' | 'table';
}

export function IconButton({
  label,
  icon,
  variant = 'ghost',
  size = 'md',
  className,
  type = 'button',
  ...rest
}: IconButtonProps) {
  return (
    <button
      type={type}
      aria-label={label}
      title={label}
      className={cn(
        'inline-flex shrink-0 cursor-pointer items-center justify-center rounded-lg text-fg transition-colors disabled:cursor-not-allowed',
        variant !== 'table' && 'disabled:text-on-disabled',
        size === 'table' ? 'size-8' : size === 'sm' ? 'size-7' : 'size-9',
        variant === 'outline'
          ? 'border border-line-strong text-primary hover:bg-surface-hover active:bg-chip'
          : variant === 'table'
            ? 'border border-line bg-surface hover:bg-surface-hover disabled:opacity-40'
            : 'hover:bg-surface-hover active:bg-chip',
        className,
      )}
      {...rest}
    >
      {icon}
    </button>
  );
}
