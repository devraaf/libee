import { useId, useState, type ReactNode } from 'react';
import { ChevronDown, Filter } from 'lucide-react';
import { Button } from './Button';
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
      <div className="relative sm:ml-auto">
        <Button
          variant="outline"
          leftIcon={<Filter size={16} aria-hidden="true" />}
          aria-expanded={filterContent ? isFilterOpen : undefined}
          aria-controls={filterContent ? filterContentId : undefined}
          onClick={() => {
            if (filterContent) setIsFilterOpen((open) => !open);
          }}
        >
          Filtrar
          <ChevronDown
            size={14}
            aria-hidden="true"
            className={`transition-transform ${isFilterOpen ? 'rotate-180' : ''}`}
          />
        </Button>
        {filterContent && isFilterOpen && (
          <div
            id={filterContentId}
            className="absolute right-0 z-20 mt-2 w-64 rounded-xl border border-line bg-surface p-4 shadow-card"
          >
            {filterContent}
          </div>
        )}
      </div>
    </div>
  );
}
