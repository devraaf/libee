import { useId } from 'react';
import { cn } from './cn';

export interface RadioOption {
  value: string;
  label: string;
}

export interface RadioGroupProps {
  legend: string;
  name: string;
  options: RadioOption[];
  value?: string;
  onChange?: (value: string) => void;
  error?: string;
  className?: string;
}

export function RadioGroup({
  legend,
  name,
  options,
  value,
  onChange,
  error,
  className,
}: RadioGroupProps) {
  const groupId = useId();

  return (
    <fieldset
      className={cn('flex flex-col gap-2', className)}
      aria-describedby={error ? `${groupId}-error` : undefined}
    >
      <legend className="type-label mb-2 text-fg">{legend}</legend>
      <div className="flex flex-wrap gap-x-5 gap-y-2">
        {options.map((option) => (
          <label
            key={option.value}
            className="type-small flex cursor-pointer items-center gap-2 text-fg"
          >
            <input
              type="radio"
              name={name}
              value={option.value}
              checked={value === undefined ? undefined : value === option.value}
              onChange={() => onChange?.(option.value)}
              className="size-4 cursor-pointer accent-primary"
            />
            {option.label}
          </label>
        ))}
      </div>
      {error && (
        <p id={`${groupId}-error`} className="type-caption text-danger">
          {error}
        </p>
      )}
    </fieldset>
  );
}
