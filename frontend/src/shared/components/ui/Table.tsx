import type { ReactNode } from 'react';
import { cn } from './cn';

export interface TableColumn<T> {
  key: string;
  header: string;
  render: (row: T) => ReactNode;
  align?: 'left' | 'center' | 'right';
  className?: string;
}

export interface TableProps<T> {
  columns: TableColumn<T>[];
  rows: T[];
  getRowKey: (row: T) => string | number;
  /** Conteúdo exibido quando não há linhas (normalmente um EmptyState). */
  emptyState?: ReactNode;
  caption?: string;
  footer?: ReactNode;
  onRowClick?: (row: T) => void;
  getRowLabel?: (row: T) => string;
  className?: string;
  tableClassName?: string;
}

const alignClass = {
  left: 'text-left',
  center: 'text-center',
  right: 'text-right',
};

export function Table<T>({
  columns,
  rows,
  getRowKey,
  emptyState,
  caption,
  footer,
  onRowClick,
  getRowLabel,
  className,
  tableClassName,
}: TableProps<T>) {
  return (
    <div
      className={cn(
        'overflow-hidden rounded-xl border border-line bg-surface',
        className,
      )}
    >
      <div className="overflow-x-auto">
        <table
          className={cn(
            'type-small w-full border-collapse text-fg',
            tableClassName,
          )}
        >
          {caption && <caption className="sr-only">{caption}</caption>}
          <thead>
            <tr className="border-b border-line-strong bg-surface-warm">
              {columns.map((column) => (
                <th
                  key={column.key}
                  scope="col"
                  className={cn(
                    'type-label px-4 py-3 font-semibold',
                    alignClass[column.align ?? 'center'],
                    column.className,
                  )}
                >
                  {column.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr
                key={getRowKey(row)}
                tabIndex={onRowClick ? 0 : undefined}
                aria-label={getRowLabel?.(row)}
                className={cn(
                  'border-b border-line last:border-b-0',
                  onRowClick &&
                    'cursor-pointer hover:bg-surface-hover focus-visible:outline focus-visible:outline-2 focus-visible:outline-inset focus-visible:outline-primary',
                )}
                onClick={(event) => {
                  if (
                    event.target instanceof Element &&
                    event.target.closest(
                      'button, a, input, select, textarea, [role="button"]',
                    )
                  ) {
                    return;
                  }
                  onRowClick?.(row);
                }}
                onKeyDown={(event) => {
                  if (
                    event.target === event.currentTarget &&
                    (event.key === 'Enter' || event.key === ' ')
                  ) {
                    event.preventDefault();
                    onRowClick?.(row);
                  }
                }}
              >
                {columns.map((column) => (
                  <td
                    key={column.key}
                    className={cn(
                      'px-4 py-3',
                      alignClass[column.align ?? 'center'],
                      column.className,
                    )}
                  >
                    {column.render(row)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {rows.length === 0 && emptyState}
      {footer && <div className="border-t border-line px-4 py-3">{footer}</div>}
    </div>
  );
}
