import { useId, useState, type ReactNode } from 'react';
import { FilterButton } from './FilterButton';
import { SearchInput } from './SearchInput';

interface SearchFilterBarProps {
  placeholder: string;
  value: string;
  onChange: (value: string) => void;
  filterContent?: ReactNode;
}

export default function SearchFilterBar({
  placeholder,
  value,
  onChange,
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
    </div>
  );
}