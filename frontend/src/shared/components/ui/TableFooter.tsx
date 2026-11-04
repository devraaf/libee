import { ChevronLeft, ChevronRight } from 'lucide-react';
import type { ReactNode } from 'react';

export interface TableFooterProps {
  text?: ReactNode;
  pages: number[];
  activePage: number;
  onPageChange: (page: number) => void;
  onPrevious: () => void;
  onNext: () => void;
}

export default function TableFooter({
  text,
  pages,
  activePage,
  onPageChange,
  onPrevious,
  onNext,
}: TableFooterProps) {
  // Pega a última página para desativar a seta "Próxima" se estiver no fim
  const maxPage = Math.max(...pages, 1);

  return (
    <div className="flex flex-col gap-2 border-t border-[#E7DCC4] px-4 py-3 text-xs text-[#6B5A45] sm:flex-row sm:items-center sm:justify-between">
      <span>{text}</span>
      <nav className="flex items-center gap-1" aria-label="Paginação">
        {/* Botão Página Anterior */}
        <button
          type="button"
          onClick={onPrevious}
          disabled={activePage === 1}
          aria-label="Página anterior"
          className="flex h-6 w-6 items-center justify-center rounded border border-[#E7DCC4] bg-white text-[#3B2A1A] transition-colors hover:bg-[#F9F5EE] hover:border-[#9A5B00] disabled:opacity-40 disabled:hover:bg-white disabled:hover:border-[#E7DCC4] cursor-pointer disabled:cursor-not-allowed"
        >
          <ChevronLeft size={16} />
        </button>

        {/* Botões Dinâmicos das Páginas */}
        {pages.map((page) => {
          const isActive = page === activePage;
          return (
            <button
              key={page}
              type="button"
              onClick={() => onPageChange(page)}
              aria-current={isActive ? 'page' : undefined}
              className={`flex h-6 min-w-6 items-center justify-center rounded border px-1 transition-colors cursor-pointer ${
                isActive
                  ? 'border-[#9A5B00] bg-[#9A5B00] text-white'
                  : 'border-[#E7DCC4] bg-white text-[#3B2A1A] hover:bg-[#F9F5EE] hover:border-[#9A5B00]'
              }`}
            >
              {page}
            </button>
          );
        })}

        {/* Botão Próxima Página */}
        <button
          type="button"
          onClick={onNext}
          disabled={activePage === maxPage}
          aria-label="Próxima página"
          className="flex h-6 w-6 items-center justify-center rounded border border-[#E7DCC4] bg-white text-[#3B2A1A] transition-colors hover:bg-[#F9F5EE] hover:border-[#9A5B00] disabled:opacity-40 disabled:hover:bg-white disabled:hover:border-[#E7DCC4] cursor-pointer disabled:cursor-not-allowed"
        >
          <ChevronRight size={16} />
        </button>
      </nav>
    </div>
  );
}
