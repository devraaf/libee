import type { ThemeContextValue } from '@/shared/types/theme';
import { createContext } from 'react';

export const ThemeContext = createContext<ThemeContextValue | null>(null);
