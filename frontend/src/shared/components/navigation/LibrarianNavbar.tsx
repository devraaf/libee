import { NavLink } from "react-router-dom";
import { Library, BookText, Inbox, Users, Moon, LogOut } from "lucide-react";
import { Logo } from "../branding/Logo";

/* Ajustar rotas- links do navbar para paginas*/
const navItems = [
  { label: "Acervo", to: "/BookCollection", icon: Library },
  { label: "Empréstimos", to: "/", icon: BookText },
  { label: "Devoluções", to: "/", icon: Inbox },
  { label: "Leitores", to: "/", icon: Users },
];

interface LibrarianNavbarProps {
  onToggleTheme?: () => void;
  onLogout?: () => void;
}

export default function LibrarianNavbar({
  onToggleTheme,
  onLogout,
}: LibrarianNavbarProps) {
  return (
    <header className="w-full border-b border-[#E7DCC4] bg-[#FFFDF5] text-[#3B2A1A]">
      <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center justify-between gap-4 px-6 py-4">
       <Logo className="h-15 sm:h-20 w-auto transition-all" />

        <div className="flex items-center gap-4 sm:gap-6">
          <nav
            aria-label="Navegação do bibliotecário"
            className="flex items-center gap-4 sm:gap-6"
          >
            {navItems.map(({ label, to, icon: Icon }) => (
              <NavLink
                key={to}
                to={to}
                title={label}
                className={({ isActive }) =>
                  `flex items-center gap-2 text-xs font-semibold transition-colors hover:text-[#9A5B00] ${
                    isActive ? "text-[#9A5B00]" : "text-[#3B2A1A]"
                  }`
                }
              >
                <Icon size={16} />
                <span className="hidden md:inline">{label}</span>
              </NavLink>
            ))}
          </nav>

          <span aria-hidden="true" className="h-10 w-px bg-[#E7DCC4]" />

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onToggleTheme}
              aria-label="Alternar tema"
              className="flex h-8 w-8 items-center justify-center rounded-lg hover:bg-[#F9F0DC]"
            >
              <Moon size={16} />
            </button>
            <button
              type="button"
              onClick={onLogout}
              aria-label="Sair"
              className="flex h-8 w-8 items-center justify-center rounded-lg hover:bg-[#F9F0DC]"
            >
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}