import { Search } from 'lucide-react'
import type { InputHTMLAttributes } from 'react'
import { cn } from './cn'
import { fieldBase } from './Input'

export interface SearchInputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  /** Rótulo acessível (o campo não exibe label visível). */
  label?: string
}

export function SearchInput({
  label = 'Pesquisar',
  placeholder = 'Pesquise por título, autor...',
  className,
  ...rest
}: SearchInputProps) {
  return (
    <div className={cn('relative w-full', className)}>
      <input
        type="search"
        aria-label={label}
        placeholder={placeholder}
        className={cn(fieldBase, 'h-10 border-line pl-4 pr-10 [&::-webkit-search-cancel-button]:hidden')}
        {...rest}
      />
      <Search
        size={16}
        aria-hidden="true"
        className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-muted"
      />
    </div>
  )
}
