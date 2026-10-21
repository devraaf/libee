import { cn } from './cn';

export interface TabItem {
  id: string;
  label: string;
}

export interface TabsProps {
  items: TabItem[];
  value: string;
  onChange: (id: string) => void;
  label: string;
}

export function Tabs({ items, value, onChange, label }: TabsProps) {
  return (
    <div role="tablist" aria-label={label} className="flex flex-wrap gap-2">
      {items.map((item) => {
        const selected = item.id === value;
        return (
          <button
            key={item.id}
            type="button"
            role="tab"
            aria-selected={selected}
            onClick={() => onChange(item.id)}
            className={cn(
              'type-label cursor-pointer rounded-xl border px-4 py-2 transition-colors',
              selected
                ? 'border-line-strong bg-chip text-fg'
                : 'border-line bg-surface text-fg hover:bg-surface-hover',
            )}
          >
            {item.label}
          </button>
        );
      })}
    </div>
  );
}
