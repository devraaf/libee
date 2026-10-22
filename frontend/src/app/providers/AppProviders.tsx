import type { ReactNode } from 'react'
import { BrowserRouter } from 'react-router-dom'
import { ThemeProvider } from './ThemeProvider'

/** BrowserRouter é necessário porque Navbar/Sidebar usam Link e NavLink. */
export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider>
      <BrowserRouter>{children}</BrowserRouter>
    </ThemeProvider>
  )
}
