import type { ButtonHTMLAttributes, ReactNode } from 'react'
import { cn } from './cn'

export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost'
export type ButtonSize = 'sm' | 'md' | 'lg'

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  size?: ButtonSize
  leftIcon?: ReactNode
  fullWidth?: boolean
}

const variants: Record<ButtonVariant, string> = {
  primary:
    'bg-primary text-on-primary hover:bg-primary-hover active:bg-primary-active disabled:bg-disabled disabled:text-on-disabled',
  secondary:
    'bg-secondary text-on-secondary hover:bg-secondary-hover active:bg-secondary-active disabled:bg-disabled disabled:text-on-disabled',
  outline:
    'border border-line-strong bg-surface text-fg hover:bg-surface-hover active:bg-chip disabled:border-line disabled:bg-disabled disabled:text-on-disabled',
  ghost:
    'bg-transparent text-fg hover:bg-surface-hover active:bg-chip disabled:bg-transparent disabled:text-on-disabled',
}

const sizes: Record<ButtonSize, string> = {
  sm: 'h-8 px-3 text-xs',
  md: 'h-10 px-4 text-sm',
  lg: 'h-12 px-5 text-sm',
}

export function Button({
  variant = 'primary',
  size = 'md',
  leftIcon,
  fullWidth,
  className,
  type = 'button',
  children,
  ...rest
}: ButtonProps) {
  return (
    <button
      type={type}
      className={cn(
        'inline-flex cursor-pointer items-center justify-center gap-2 rounded-xl font-semibold transition-colors disabled:cursor-not-allowed',
        variants[variant],
        sizes[size],
        fullWidth && 'w-full',
        className,
      )}
      {...rest}
    >
      {leftIcon}
      {children}
    </button>
  )
}
