import { ChevronLeft, ChevronRight } from 'lucide-react';
import type { ReactNode } from 'react';
import { cn } from './cn';

export interface PaginationProps {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  /** Texto à esquerda, ex.: "Mostrando 5 de 100 livros". */
  summary?: ReactNode;
  className?: string;
}

type PageItem = number | 'ellipsis';

function buildPages(page: number, total: number): PageItem[] {
  if (total <= 5) return Array.from({ length: total }, (_, i) => i + 1);
  const items: PageItem[] = [1];
  const start = Math.max(2, page - 1);
  const end = Math.min(total - 1, page + 1);
  if (start > 2) items.push('ellipsis');
  for (let p = start; p <= end; p += 1) items.push(p);
  if (end < total - 1) items.push('ellipsis');
  items.push(total);
  return items;
}

const pageButton =
  'inline-flex size-7 cursor-pointer items-center justify-center rounded-md border text-xs transition-colors disabled:cursor-not-allowed disabled:text-on-disabled';

export function Pagination({
  page,
  totalPages,
  onPageChange,
  summary,
  className,
}: PaginationProps) {
  const total = Math.max(totalPages, 1);

  return (
    <div
      className={cn(
        'flex flex-wrap items-center justify-between gap-3',
        className,
      )}
    >
      <p className="type-caption text-muted">{summary}</p>
      <nav aria-label="Paginação" className="flex items-center gap-1">
        <button
          type="button"
          aria-label="Página anterior"
          className={cn(
            pageButton,
            'border-line bg-surface text-fg hover:bg-surface-hover',
          )}
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
        >
          <ChevronLeft size={14} />
        </button>
        {buildPages(page, total).map((item, index) =>
          item === 'ellipsis' ? (
            <span
              key={`e${index}`}
              aria-hidden="true"
              className="px-1 text-xs text-muted"
            >
              …
            </span>
          ) : (
            <button
              key={item}
              type="button"
              aria-current={item === page ? 'page' : undefined}
              className={cn(
                pageButton,
                item === page
                  ? 'border-primary bg-primary text-on-primary'
                  : 'border-line bg-surface text-fg hover:bg-surface-hover',
              )}
              onClick={() => onPageChange(item)}
            >
              {item}
            </button>
          ),
        )}
        <button
          type="button"
          aria-label="Próxima página"
          className={cn(
            pageButton,
            'border-line bg-surface text-fg hover:bg-surface-hover',
          )}
          disabled={page >= total}
          onClick={() => onPageChange(page + 1)}
        >
          <ChevronRight size={14} />
        </button>
      </nav>
    </div>
  );
}
