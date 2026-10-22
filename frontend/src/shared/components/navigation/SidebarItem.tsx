import { NavLink, useLocation, useResolvedPath } from 'react-router-dom';
import type { NavLinkItem } from '../../types/navigation';
import { cn } from '../ui/cn';
import { isNavItemActive } from './isNavItemActive';

export interface SidebarItemProps {
  item: NavLinkItem;
  collapsed?: boolean;
  onNavigate?: () => void;
}

export function SidebarItem({ item, collapsed, onNavigate }: SidebarItemProps) {
  const Icon = item.icon;
  const location = useLocation();
  const target = useResolvedPath(item.to);

  return (
    <NavLink
      to={item.to}
      end={item.end}
      onClick={onNavigate}
      title={collapsed ? item.label : undefined}
      aria-label={collapsed ? item.label : undefined}
      className={({ isActive: isRouteActive }) => {
        const isActive = isNavItemActive({
          isRouteActive,
          targetPathname: target.pathname,
          targetHash: target.hash,
          locationPathname: location.pathname,
          locationHash: location.hash,
        });

        return cn(
          'type-small flex h-10 items-center gap-3 rounded-lg px-3 transition-colors',
          collapsed && 'justify-center px-0',
          isActive
            ? 'bg-primary font-medium text-on-primary shadow-sm'
            : 'text-muted hover:bg-surface-hover hover:text-fg',
        );
      }}
    >
      <Icon size={18} aria-hidden="true" className="shrink-0" />
      {!collapsed && <span className="truncate">{item.label}</span>}
    </NavLink>
  );
}
