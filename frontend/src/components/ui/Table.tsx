import type { ReactNode } from 'react'
import { cn } from './cn'

export interface TableColumn<T> {
  key: string
  header: string
  render: (row: T) => ReactNode
  align?: 'left' | 'center' | 'right'
  className?: string
}

export interface TableProps<T> {
  columns: TableColumn<T>[]
  rows: T[]
  getRowKey: (row: T) => string | number
  /** Conteúdo exibido quando não há linhas (normalmente um EmptyState). */
  emptyState?: ReactNode
  caption?: string
  footer?: ReactNode
  className?: string
}

const alignClass = { left: 'text-left', center: 'text-center', right: 'text-right' }

export function Table<T>({ columns, rows, getRowKey, emptyState, caption, footer, className }: TableProps<T>) {
  return (
    <div className={cn('overflow-hidden rounded-xl border border-line bg-surface', className)}>
      <div className="overflow-x-auto">
        <table className="type-small w-full min-w-[640px] border-collapse text-fg">
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
              <tr key={getRowKey(row)} className="border-b border-line last:border-b-0">
                {columns.map((column) => (
                  <td key={column.key} className={cn('px-4 py-3', alignClass[column.align ?? 'center'], column.className)}>
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
  )
}
