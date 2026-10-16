import type { ReactNode } from 'react'
import { cn } from './cn'

export type BadgeVariant = 'success' | 'warning' | 'info' | 'danger' | 'neutral'

export interface BadgeProps {
  variant: BadgeVariant
  children: ReactNode
  /** ponto colorido antes do texto (usado nos status de livros). */
  dot?: boolean
  className?: string
}

const variants: Record<BadgeVariant, string> = {
  success: 'border-ok-line bg-ok-bg text-ok',
  warning: 'border-warn-line bg-warn-bg text-warn',
  info: 'border-info-line bg-info-bg text-info',
  danger: 'border-danger-line bg-danger-bg text-danger',
  neutral: 'border-neutral-line bg-neutral-bg text-neutral',
}

export function Badge({ variant, children, dot, className }: BadgeProps) {
  return (
    <span
      className={cn(
        'type-caption inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border px-2.5 py-1',
        variants[variant],
        className,
      )}
    >
      {dot && <span aria-hidden="true" className="size-1.5 rounded-full bg-current" />}
      {children}
    </span>
  )
}
