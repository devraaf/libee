import { Search, ListFilter } from "lucide-react";

interface SearchFilterBarProps {
  placeholder: string;
  value: string;
  onChange: (value: string) => void;
}

export default function SearchFilterBar({
  placeholder,
  value,
  onChange,
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
    </div>
  );
}