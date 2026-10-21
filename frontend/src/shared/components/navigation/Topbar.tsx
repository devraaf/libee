import { Bell, Menu } from 'lucide-react';
import { IconButton } from '../ui/IconButton';
import { SearchInput } from '../ui/SearchInput';
import { ThemeToggle } from './ThemeToggle';

export interface TopbarProps {
  /** Abre a sidebar em telas pequenas. */
  onOpenMenu: () => void;
}

/** Cabeçalho do layout com sidebar: busca global, tema e notificações. */
export function Topbar({ onOpenMenu }: TopbarProps) {
  return (
    <header className="sticky top-0 z-20 flex h-16 items-center gap-3 border-b border-line bg-bg/95 px-4 backdrop-blur sm:px-6">
      <IconButton
        label="Abrir menu"
        icon={<Menu size={20} />}
        onClick={onOpenMenu}
        className="md:hidden"
      />
      <SearchInput
        label="Pesquisar no Libee"
        placeholder="Pesquisar"
        className="mx-auto max-w-xl"
      />
      <div className="flex items-center gap-2">
        <ThemeToggle className="bg-accent-soft hover:bg-accent-soft" />
        <IconButton
          label="Notificações"
          icon={<Bell size={18} />}
          className="bg-accent-soft hover:bg-accent-soft"
        />
      </div>
    </header>
  );
}
