import { useEffect, useRef, useState } from 'react';
import { NavLink, useLocation, useResolvedPath } from 'react-router-dom';
import { ChevronDown } from 'lucide-react';
import type { NavLinkItem } from '../../types/navigation';
import { cn } from '../ui/cn';
import { isNavItemActive } from './isNavItemActive';

export interface NavItemProps {
  item: NavLinkItem;
  onNavigate?: () => void;
  className?: string;
}

/** Item de navegação horizontal/vertical com suporte opcional a dropdown. */
export function NavItem({ item, onNavigate, className }: NavItemProps) {
  const Icon = item.icon;
  const location = useLocation();
  const target = useResolvedPath(item.to);
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const hasChildren = Boolean(item.children && item.children.length > 0);

  const isGroupActive =
    hasChildren &&
    (item.children!.some((child) => location.pathname.startsWith(child.to)) ||
      item.activePaths?.some((path) => location.pathname.startsWith(path)));

  useEffect(() => {
    if (!open) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [open]);

  if (hasChildren) {
    return (
      <div ref={containerRef} className="relative">
        <button
          type="button"
          aria-expanded={open}
          aria-haspopup="menu"
          onClick={() => setOpen((prev) => !prev)}
          className={cn(
            'type-label inline-flex items-center gap-2 rounded-lg px-3 py-2 transition-colors hover:bg-surface-hover',
            isGroupActive || open ? 'text-primary' : 'text-fg',
            className,
          )}
        >
          <Icon size={18} aria-hidden="true" />
          {item.label}
          <ChevronDown
            size={15}
            aria-hidden="true"
            className={cn(
              'transition-transform duration-150',
              open && 'rotate-180',
            )}
          />
        </button>

        {open && (
          <div
            role="menu"
            className="absolute left-0 top-full z-50 mt-1.5 min-w-[200px] rounded-xl border border-line bg-surface p-1.5 shadow-lg"
          >
            {item.children!.map((child) => {
              const ChildIcon = child.icon;
              return (
                <NavLink
                  key={child.to}
                  to={child.to}
                  role="menuitem"
                  onClick={() => {
                    setOpen(false);
                    onNavigate?.();
                  }}
                  className={({ isActive }) =>
                    cn(
                      'type-label flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-colors hover:bg-surface-hover',
                      isActive ? 'bg-primary/10 text-primary' : 'text-fg',
                    )
                  }
                >
                  {ChildIcon && <ChildIcon size={16} aria-hidden="true" />}
                  {child.label}
                </NavLink>
              );
            })}
          </div>
        )}
      </div>
    );
  }

  return (
    <NavLink
      to={item.to}
      end={item.end}
      onClick={onNavigate}
      className={({ isActive: isRouteActive }) => {
        const isActive =
          isNavItemActive({
            isRouteActive,
            targetPathname: target.pathname,
            targetHash: target.hash,
            locationPathname: location.pathname,
            locationHash: location.hash,
          }) ||
          item.activePaths?.some((path) => location.pathname.startsWith(path));

        return cn(
          'type-label inline-flex items-center gap-2 rounded-lg px-3 py-2 transition-colors hover:bg-surface-hover',
          isActive ? 'text-primary' : 'text-fg',
          className,
        );
      }}
    >
      <Icon size={18} aria-hidden="true" />
      {item.label}
    </NavLink>
  );
}