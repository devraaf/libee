import { Moon, Sun } from 'lucide-react';
import { useTheme } from '../../hooks/useTheme';
import { IconButton } from '../ui/IconButton';

export interface ThemeToggleProps {
  className?: string;
}

export function ThemeToggle({ className }: ThemeToggleProps) {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === 'dark';

  return (
    <IconButton
      label={isDark ? 'Ativar tema claro' : 'Ativar tema escuro'}
      icon={isDark ? <Sun size={18} /> : <Moon size={18} />}
      onClick={toggleTheme}
      className={className}
    />
  );
}
