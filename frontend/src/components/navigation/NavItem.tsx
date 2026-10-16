import { NavLink } from 'react-router-dom'
import type { NavLinkItem } from '../../types/navigation'
import { cn } from '../ui/cn'

export interface NavItemProps {
  item: NavLinkItem
  onNavigate?: () => void
  className?: string
}

/** Item de navegação horizontal (Navbar). */
export function NavItem({ item, onNavigate, className }: NavItemProps) {
  const Icon = item.icon

  return (
    <NavLink
      to={item.to}
      end={item.end}
      onClick={onNavigate}
      className={({ isActive }) =>
        cn(
          'type-label inline-flex items-center gap-2 rounded-lg px-3 py-2 transition-colors hover:bg-surface-hover',
          isActive ? 'text-primary' : 'text-fg',
          className,
        )
      }
    >
      <Icon size={18} aria-hidden="true" />
      {item.label}
    </NavLink>
  )
}
