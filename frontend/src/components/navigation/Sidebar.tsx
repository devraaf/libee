import { ChevronLeft, ChevronRight, LogOut } from 'lucide-react'
import { Link } from 'react-router-dom'
import type { NavLinkItem } from '../../types/navigation'
import { Logo } from '../branding/Logo.tsx'
import { cn } from '../ui/cn'
import { SidebarItem } from './SidebarItem'

export interface SidebarProps {
  links: NavLinkItem[]
  collapsed: boolean
  onToggleCollapsed: () => void
  /** Em telas pequenas a sidebar vira um painel sobreposto. */
  mobileOpen: boolean
  onCloseMobile: () => void
  homeTo?: string
  logoutTo?: string
}

export function Sidebar({
  links,
  collapsed,
  onToggleCollapsed,
  mobileOpen,
  onCloseMobile,
  homeTo = '/estudante',
  logoutTo = '/login',
}: SidebarProps) {
  // No painel móvel a sidebar sempre aparece expandida.
  const compact = collapsed && !mobileOpen

  return (
    <>
      {mobileOpen && (
        <button
          type="button"
          aria-label="Fechar menu"
          onClick={onCloseMobile}
          className="fixed inset-0 z-40 bg-black/40 md:hidden"
        />
      )}
      <aside
        aria-label="Navegação lateral"
        className={cn(
          'fixed inset-y-0 left-0 z-50 flex flex-col border-r border-line bg-bg transition-[width,transform] md:sticky md:top-0 md:h-dvh md:translate-x-0',
          compact ? 'w-[76px]' : 'w-64',
          mobileOpen ? 'translate-x-0' : '-translate-x-full',
        )}
      >
        <div className="relative flex h-24 items-center justify-center px-4">
          <Link to={homeTo} aria-label="Libee - página inicial" onClick={onCloseMobile}>
            {compact ? <Logo variant="mark" heightClassName="h-12" /> : <Logo heightClassName="h-14" />}
          </Link>
          <button
            type="button"
            onClick={onToggleCollapsed}
            aria-label={collapsed ? 'Expandir menu lateral' : 'Recolher menu lateral'}
            aria-expanded={!collapsed}
            className="absolute -right-3 top-8 hidden size-6 cursor-pointer items-center justify-center rounded-full bg-primary text-on-primary shadow-sm hover:bg-primary-hover md:flex"
          >
            {collapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
          </button>
        </div>

        <nav aria-label="Principal" className="flex flex-1 flex-col gap-1 border-b border-line px-3 pb-4 pt-2">
          {links.map((item) => (
            <SidebarItem key={item.to} item={item} collapsed={compact} onNavigate={onCloseMobile} />
          ))}
        </nav>

        <div className="px-3 py-4">
          <Link
            to={logoutTo}
            title={compact ? 'Sair' : undefined}
            aria-label={compact ? 'Sair' : undefined}
            onClick={onCloseMobile}
            className={cn(
              'type-small flex h-10 items-center gap-3 rounded-lg px-3 text-muted transition-colors hover:bg-surface-hover hover:text-fg',
              compact && 'justify-center px-0',
            )}
          >
            <LogOut size={18} aria-hidden="true" />
            {!compact && 'Sair'}
          </Link>
        </div>
      </aside>
    </>
  )
}
