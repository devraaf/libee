import { LogOut, Menu, X } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useDisclosure } from '../../hooks/useDisclosure'
import type { NavLinkItem } from '../../types/navigation'
import { Logo } from '../branding/Logo.tsx'
import { IconButton } from '../ui/IconButton'
import { NavItem } from './NavItem'
import { ThemeToggle } from './ThemeToggle'

export interface NavbarProps {
  links: NavLinkItem[]
  /** Rota aberta ao clicar na logo. */
  homeTo?: string
  /** Exibe o botão de sair (áreas autenticadas). */
  showLogout?: boolean
  logoutTo?: string
}

export function Navbar({ links, homeTo = '/', showLogout = false, logoutTo = '/login' }: NavbarProps) {
  const menu = useDisclosure()

  return (
    <header className="sticky top-0 z-30 border-b border-line bg-bg/95 backdrop-blur">
      <div className="mx-auto flex h-20 w-full max-w-7xl items-center justify-between gap-4 px-4 sm:px-8">
        <Link to={homeTo} aria-label="Libee - página inicial" className="rounded-lg">
          <Logo heightClassName="h-12 sm:h-14" />
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
        <nav id="navbar-mobile-menu" aria-label="Principal" className="border-t border-line bg-bg px-4 py-3 md:hidden">
          <ul className="flex flex-col gap-1">
            {links.map((item) => (
              <li key={item.to}>
                <NavItem item={item} onNavigate={menu.close} className="w-full" />
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
  )
}
