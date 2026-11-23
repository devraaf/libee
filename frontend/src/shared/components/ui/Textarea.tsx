import { useId, type TextareaHTMLAttributes } from 'react';
import { cn } from './cn';

export interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  hint?: string;
  density?: 'default' | 'compact';
  containerClassName?: string;
}

export function Textarea({
  label,
  error,
  hint,
  id,
  className,
  containerClassName,
  density = 'default',
  ...rest
}: TextareaProps) {
  const autoId = useId();
  const textareaId = id ?? autoId;
  const messageId = `${textareaId}-message`;
  const hasMessage = Boolean(error ?? hint);

  return (
    <div className={cn('flex flex-col gap-1.5', containerClassName)}>
      {label && (
        <label htmlFor={textareaId} className="type-label text-fg">
          {label}
        </label>
      )}
      <textarea
        id={textareaId}
        aria-invalid={error ? true : undefined}
        aria-describedby={hasMessage ? messageId : undefined}
        className={cn(
          'w-full rounded-xl border bg-surface px-4 py-3 type-small text-fg placeholder:text-subtle transition-colors focus:border-line-strong focus:outline-none focus:ring-1 focus:ring-line-strong',
          density === 'compact' && 'rounded-lg px-3 py-2 text-sm',
          error
            ? 'border-danger focus:border-danger focus:ring-danger'
            : 'border-line',
          className,
        )}
        {...rest}
      />
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
