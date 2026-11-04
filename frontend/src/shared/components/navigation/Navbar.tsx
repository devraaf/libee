import type { NavLinkItem } from '../../types/navigation.ts';
import { cn } from '../ui/cn.ts';
import { NavItem } from './NavItem.tsx';

export interface NavbarProps {
  links: NavLinkItem[];
  orientation?: 'horizontal' | 'vertical';
  className?: string;
}

export function Navbar({
  links,
  orientation = 'horizontal',
  className,
}: NavbarProps) {
  const isHorizontal = orientation === 'horizontal';

  return (
<<<<<<< HEAD
    <header className="sticky top-0 z-30 border-b border-line bg-bg/95 backdrop-blur">
      <div className="mx-auto flex h-20 w-full max-w-7xl items-center justify-between gap-4 px-4 sm:px-8">
        <Link
          to={homeTo}
          aria-label="Libee - página inicial"
          className="rounded-lg"
        >
        <Logo className="h-15 sm:h-20 w-auto transition-all" />
        </Link>

        <div className="hidden items-center gap-1 md:flex">
          <nav aria-label="Principal" className="flex items-center gap-1">
            {links.map((item) => (
              <NavItem key={item.to} item={item} />
            ))}
          </nav>
          <span aria-hidden="true" className="mx-3 h-6 w-px bg-line" />
          <ThemeToggle />
          {showLogout && (
            <Link
              to={logoutTo}
              aria-label="Sair"
              title="Sair"
              className="inline-flex size-9 items-center justify-center rounded-lg text-fg transition-colors hover:bg-surface-hover"
            >
              <LogOut size={18} />
            </Link>
          )}
        </div>

        <div className="flex items-center gap-1 md:hidden">
          <ThemeToggle />
          <IconButton
            label={menu.isOpen ? 'Fechar menu' : 'Abrir menu'}
            aria-expanded={menu.isOpen}
            aria-controls="navbar-mobile-menu"
            icon={menu.isOpen ? <X size={20} /> : <Menu size={20} />}
            onClick={menu.toggle}
          />
        </div>
      </div>

      {menu.isOpen && (
        <nav
          id="navbar-mobile-menu"
          aria-label="Principal"
          className="border-t border-line bg-bg px-4 py-3 md:hidden"
        >
          <ul className="flex flex-col gap-1">
            {links.map((item) => (
              <li key={item.to}>
                <NavItem
                  item={item}
                  onNavigate={menu.close}
                  className="w-full"
                />
              </li>
            ))}
            {showLogout && (
              <li>
                <Link
                  to={logoutTo}
                  onClick={menu.close}
                  className="type-label flex items-center gap-2 rounded-lg px-3 py-2 text-fg hover:bg-surface-hover"
                >
                  <LogOut size={18} aria-hidden="true" />
                  Sair
                </Link>
              </li>
            )}
          </ul>
        </nav>
      )}
    </header>
=======
    <nav
      aria-label="Principal"
      className={cn(isHorizontal && 'flex items-center', className)}
    >
      <ul
        className={cn('flex gap-1', isHorizontal ? 'items-center' : 'flex-col')}
      >
        {links.map((item) => (
          <li key={item.to}>
            <NavItem
              item={item}
              className={!isHorizontal ? 'w-full' : undefined}
            />
          </li>
        ))}
      </ul>
    </nav>
>>>>>>> ba44c07eb90a0b89a04aec4aa83370057ede9db9
  );
}
