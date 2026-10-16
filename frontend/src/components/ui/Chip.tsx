import type { ReactNode } from 'react'
import { cn } from './cn'

export interface ChipProps {
  children: ReactNode
  className?: string
}

/** Etiqueta neutra (categoria, vínculo, gênero). */
export function Chip({ children, className }: ChipProps) {
  return (
    <span className={cn('type-caption inline-flex items-center rounded-full bg-chip px-3 py-1 text-muted', className)}>
      {children}
    </span>
  )
}
