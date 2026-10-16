import type { LucideIcon } from 'lucide-react'

export interface NavLinkItem {
  label: string
  to: string
  icon: LucideIcon
  /** Quando verdadeiro, só fica ativo na rota exata (ex.: "/"). */
  end?: boolean
}
