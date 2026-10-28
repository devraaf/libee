import type { LucideIcon } from 'lucide-react';

export interface NavLinkItem {
  label: string;
  to: string;
  icon: LucideIcon;
  /** Quando verdadeiro, só fica ativo na rota exata (ex.: "/"). */
  end?: boolean;
  /** Rotas adicionais que também devem destacar este item no menu. */
  activePaths?: string[];
}
