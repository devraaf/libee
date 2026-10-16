import { SlidersHorizontal } from 'lucide-react'
import type { ButtonHTMLAttributes } from 'react'
import { cn } from './cn'

export interface FilterButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  expanded?: boolean
}

export function FilterButton({ expanded, className, type = 'button', ...rest }: FilterButtonProps) {
  return (
    <button
      type={type}
      aria-expanded={expanded}
      className={cn(
        'type-small inline-flex h-10 cursor-pointer items-center justify-between gap-3 rounded-xl border border-line bg-surface px-4 text-muted transition-colors hover:bg-surface-hover',
        className,
      )}
      {...rest}
    >
      Filtrar
      <SlidersHorizontal size={16} aria-hidden="true" />
    </button>
  )
}
