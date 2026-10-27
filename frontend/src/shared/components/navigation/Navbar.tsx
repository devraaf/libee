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
  );
}
