import { Search, SlidersHorizontal } from 'lucide-react';

export type StatusFilter = 'all' | 'on_time' | 'overdue';

interface ReaderLoanFiltersProps {
  search: string;
  status: StatusFilter;
  onSearchChange: (value: string) => void;
  onStatusChange: (value: StatusFilter) => void;
}

const controlClass =
  'h-9 w-full rounded-lg border border-line bg-surface text-xs text-fg focus:border-primary focus:outline-none';

export default function ReaderLoanFilters({
  search,
  status,
  onSearchChange,
  onStatusChange,
}: ReaderLoanFiltersProps) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row">
      <label className="relative flex-1">
        <span className="sr-only">Pesquisar por título ou autor</span>
        <input
          type="search"
          value={search}
          onChange={(event) => onSearchChange(event.target.value)}
          placeholder="Pesquise por título, autor..."
          className={`${controlClass} pl-3 pr-9 placeholder:text-subtle`}
        />
        <Search
          aria-hidden="true"
          className="pointer-events-none absolute right-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted"
        />
      </label>

      <label className="relative sm:w-28">
        <span className="sr-only">Filtrar por situação</span>
        <select
          value={status}
          onChange={(event) => onStatusChange(event.target.value as StatusFilter)}
          className={`${controlClass} appearance-none pl-3 pr-8`}
        >
          <option value="all">Filtrar</option>
          <option value="on_time">Em dia</option>
          <option value="overdue">Atrasado</option>
        </select>
        <SlidersHorizontal
          aria-hidden="true"
          className="pointer-events-none absolute right-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted"
        />
      </label>
    </div>
  );
}