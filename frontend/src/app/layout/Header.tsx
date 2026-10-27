import {
  BookText,
  Home,
  Inbox,
  Library,
  LogIn,
  LogOut,
  Menu,
  UserPlus,
  Users,
  X
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { Logo } from '../../shared/components/branding/Logo';
import { Navbar } from '../../shared/components/navigation/Navbar';
import { ThemeToggle } from '../../shared/components/navigation/ThemeToggle';
import { IconButton } from '../../shared/components/ui/IconButton';
import { useDisclosure } from '../../shared/hooks/useDisclosure';
import type { NavLinkItem } from '../../shared/types/navigation';

export type HeaderProfile = 'public' | 'reader' | 'librarian';

const navigationByProfile: Record<HeaderProfile, NavLinkItem[]> = {
  public: [
    { label: 'Início', to: '/', icon: Home, end: true },
    { label: 'Entrar', to: '/entrar', icon: LogIn, end: true },
    { label: 'Cadastrar-se', to: '/cadastro', icon: UserPlus, end: true },
  ],
  reader: [
    {
      label: 'Acervo',
      to: '/acervo',
      icon: Library,
      end: true,
      activePaths: ['/livros/'],
    },
    {
      label: 'Empréstimos',
      to: '/emprestimos',
      icon: BookText,
      end: true,
    },
  ],
  librarian: [
    {
      label: 'Acervo',
      to: '/gerenciamento/acervo',
      icon: Library,
      end: true,
    },
    {
      label: 'Empréstimos',
      to: '/gerenciamento/emprestimos',
      icon: BookText,
      end: true,
    },
    {
      label: 'Devoluções',
      to: '/gerenciamento/devolucoes',
      icon: Inbox,
      end: true,
    },
    {
      label: 'Leitores',
      to: '/gerenciamento/leitores',
      icon: Users,
      end: true,
    },
  ],
};

export interface HeaderProps {
  profile: HeaderProfile;
  onSignOut?: () => void;
}

export function Header({ profile, onSignOut }: HeaderProps) {
  const menu = useDisclosure();
  const links = navigationByProfile[profile];
  const homeTo = profile === 'public' ? '/' : links[0].to;
  const canSignOut = profile !== 'public' && onSignOut !== undefined;

  return (
    <header className="sticky top-0 z-30 border-b border-line bg-bg/95 backdrop-blur">
      <div className="mx-auto flex h-20 w-full max-w-7xl items-center justify-between gap-4 px-4 sm:px-8">
        <Link to={homeTo} aria-label="Libee" className="rounded-lg">
          <Logo heightClassName="h-12 sm:h-14" />
        </Link>

        <div className="hidden items-center gap-1 md:flex">
          <Navbar links={links} />
          <span aria-hidden="true" className="mx-3 h-6 w-px bg-line" />
          <ThemeToggle />
          {canSignOut && (
            <button
              type="button"
              onClick={onSignOut}
              aria-label="Sair"
              title="Sair"
              className="inline-flex size-9 items-center justify-center rounded-lg text-fg transition-colors hover:bg-surface-hover"
            >
              <LogOut size={18} aria-hidden="true" />
            </button>
          )}
        </div>

        <div className="flex items-center gap-1 md:hidden">
          <ThemeToggle />
          <IconButton
            label={menu.isOpen ? 'Fechar menu' : 'Abrir menu'}
            aria-expanded={menu.isOpen}
            aria-controls="header-mobile-menu"
            icon={menu.isOpen ? <X size={20} /> : <Menu size={20} />}
            onClick={menu.toggle}
          />
        </div>
      </div>

      {menu.isOpen && (
        <div
          id="header-mobile-menu"
          className="border-t border-line bg-bg px-4 py-3 md:hidden"
        >
          <div className="mx-auto max-w-7xl">
            <Navbar links={links} orientation="vertical" className="w-full" />
            {canSignOut && (
              <button
                type="button"
                onClick={() => {
                  onSignOut();
                  menu.close();
                }}
                className="type-label mt-1 flex w-full items-center gap-2 rounded-lg px-3 py-2 text-fg hover:bg-surface-hover"
              >
                <LogOut size={18} aria-hidden="true" />
                Sair
              </button>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
