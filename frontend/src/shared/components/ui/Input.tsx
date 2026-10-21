import { useId, type InputHTMLAttributes, type ReactNode } from 'react';
import { cn } from './cn';

export interface InputProps extends Omit<
  InputHTMLAttributes<HTMLInputElement>,
  'size'
> {
  label?: string;
  error?: string;
  hint?: string;
  /** Elemento exibido no fim do campo (ex.: botão de mostrar senha). */
  trailing?: ReactNode;
  containerClassName?: string;
}

export const fieldBase =
  'w-full rounded-xl border bg-surface text-sm text-fg placeholder:text-subtle transition-colors focus:border-line-strong focus:outline-none focus:ring-1 focus:ring-line-strong disabled:cursor-not-allowed disabled:bg-disabled disabled:text-on-disabled';

export function Input({
  label,
  error,
  hint,
  trailing,
  id,
  className,
  containerClassName,
  ...rest
}: InputProps) {
  const autoId = useId();
  const inputId = id ?? autoId;
  const messageId = `${inputId}-message`;
  const hasMessage = Boolean(error ?? hint);

  return (
    <div className={cn('flex flex-col gap-1.5', containerClassName)}>
      {label && (
        <label htmlFor={inputId} className="type-label text-fg">
          {label}
        </label>
      )}
      <div className="relative">
        <input
          id={inputId}
          aria-invalid={error ? true : undefined}
          aria-describedby={hasMessage ? messageId : undefined}
          className={cn(
            fieldBase,
            'h-11 px-4',
            trailing ? 'pr-11' : undefined,
            error
              ? 'border-danger focus:border-danger focus:ring-danger'
              : 'border-line',
            className,
          )}
          {...rest}
        />
        {trailing && (
          <div className="absolute inset-y-0 right-1 flex items-center">
            {trailing}
          </div>
        )}
      </div>
      {hasMessage && (
        <p
          id={messageId}
          className={cn('type-caption', error ? 'text-danger' : 'text-muted')}
        >
          {error ?? hint}
        </p>
      )}
    </div>
  );
}
