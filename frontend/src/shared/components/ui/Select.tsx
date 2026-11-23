import { ChevronDown } from 'lucide-react';
import { useId, type SelectHTMLAttributes } from 'react';
import { cn } from './cn';
import { fieldBase } from './Input';

export interface SelectOption {
  value: string;
  label: string;
}

export interface SelectProps extends Omit<
  SelectHTMLAttributes<HTMLSelectElement>,
  'children'
> {
  label?: string;
  error?: string;
  density?: 'default' | 'compact';
  options: SelectOption[];
  placeholder?: string;
  placeholderDisabled?: boolean;
  containerClassName?: string;
}

export function Select({
  label,
  error,
  options,
  placeholder = 'Selecione',
  placeholderDisabled = true,
  id,
  className,
  containerClassName,
  density = 'default',
  defaultValue,
  value,
  ...rest
}: SelectProps) {
  const autoId = useId();
  const selectId = id ?? autoId;
  const controlled = value !== undefined;

  return (
    <div className={cn('flex flex-col gap-1.5', containerClassName)}>
      {label && (
        <label htmlFor={selectId} className="type-label text-fg">
          {label}
        </label>
      )}
      <div className="relative">
        <select
          id={selectId}
          aria-invalid={error ? true : undefined}
          className={cn(
            fieldBase,
            density === 'compact'
              ? 'h-auto cursor-pointer appearance-none rounded-lg px-3 py-2 pr-9 type-small'
              : 'h-11 cursor-pointer appearance-none pl-4 pr-10',
            error ? 'border-danger' : 'border-line',
            className,
          )}
          {...(controlled ? { value } : { defaultValue: defaultValue ?? '' })}
          {...rest}
        >
          <option value="" disabled={placeholderDisabled}>
            {placeholder}
          </option>
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <ChevronDown
          size={16}
          aria-hidden="true"
          className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-muted"
        />
      </div>
      {error && <p className="type-caption text-danger">{error}</p>}
    </div>
  );
}
