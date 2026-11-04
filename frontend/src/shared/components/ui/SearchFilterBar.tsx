<<<<<<< HEAD
import { Search, ListFilter } from "lucide-react";
=======
import { useId, useState, type ReactNode } from 'react';
import { FilterButton } from './FilterButton';
import { SearchInput } from './SearchInput';
>>>>>>> ba44c07eb90a0b89a04aec4aa83370057ede9db9

interface SearchFilterBarProps {
  placeholder: string;
  value: string;
  onChange: (value: string) => void;
<<<<<<< HEAD
=======
  filterContent?: ReactNode;
>>>>>>> ba44c07eb90a0b89a04aec4aa83370057ede9db9
}

export default function SearchFilterBar({
  placeholder,
  value,
  onChange,
<<<<<<< HEAD
}: SearchFilterBarProps) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="relative w-full sm:max-w-sm">
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-full rounded-lg border border-[var(--lib-border)] bg-[var(--lib-surface)] py-2 pl-3 pr-9 text-sm text-[color:var(--lib-text)] placeholder:text-[color:var(--lib-placeholder)] focus:border-[var(--lib-accent)] focus:outline-none"
        />
        <Search
          size={16}
          className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[color:var(--lib-muted)]"
        />
      </div>
      <button
        type="button"
        className="flex w-full items-center justify-between gap-6 rounded-lg border border-[var(--lib-border)] bg-[var(--lib-surface)] px-3 py-2 text-sm text-[color:var(--lib-muted)] sm:w-40"
      >
        Filtrar
        <ListFilter size={16} />
      </button>
=======
  filterContent,
}: SearchFilterBarProps) {
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const filterContentId = useId();

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
      <SearchInput
        label={placeholder}
        placeholder={placeholder}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="sm:max-w-sm"
      />
      {filterContent && (
        <div className="relative sm:ml-auto">
          <FilterButton
            expanded={isFilterOpen}
            aria-controls={filterContentId}
            className={isFilterOpen ? 'bg-surface-hover' : undefined}
            onClick={() => setIsFilterOpen((open) => !open)}
          />
          {isFilterOpen && (
            <div
              id={filterContentId}
              className="absolute right-0 z-20 mt-2 w-64 rounded-xl border border-line bg-surface p-4 shadow-card"
            >
              {filterContent}
            </div>
          )}
        </div>
      )}
>>>>>>> ba44c07eb90a0b89a04aec4aa83370057ede9db9
    </div>
  );
}