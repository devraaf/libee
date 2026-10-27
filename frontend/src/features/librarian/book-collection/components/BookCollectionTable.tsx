import { Pencil, X } from 'lucide-react';
import { EmptyState } from '../../../../shared/components/ui/EmptyState';
import {
  Table,
  type TableColumn,
} from '../../../../shared/components/ui/Table';
import { Pagination } from '../../../../shared/components/ui/Pagination';

export interface BookCollectionItem {
  id: number;
  title: string;
  authors: string;
  isbn: string;
  category: string;
  copies: number;
  coverImageUrl: string | null;
}

export interface BookCollectionTableProps {
  books: BookCollectionItem[];
  page: number;
  totalItems: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export function BookCollectionTable({
  books,
  page,
  totalItems,
  totalPages,
  onPageChange,
}: BookCollectionTableProps) {
  const summary = `Mostrando ${books.length} de ${totalItems} ${
    totalItems === 1 ? 'livro' : 'livros'
  }`;
  const columns: TableColumn<BookCollectionItem>[] = [
    {
      key: 'cover',
      header: 'Capa',
      render: (book) => (
        <img
          src={book.coverImageUrl ?? '/images/book-cover-placeholder.svg'}
          alt={`Capa de ${book.title}`}
          className="h-12 w-9 rounded object-cover"
        />
      ),
    },
    {
      key: 'title',
      header: 'Título',
      align: 'left',
      render: (book) => book.title,
    },
    {
      key: 'authors',
      header: 'Autor(es)',
      align: 'left',
      render: (book) => book.authors,
    },
    {
      key: 'isbn',
      header: 'ISBN',
      render: (book) => book.isbn,
    },
    {
      key: 'category',
      header: 'Categoria',
      render: (book) => (
        <span className="rounded-full bg-chip px-3 py-1 text-xs text-muted">
          {book.category}
        </span>
      ),
    },
    {
      key: 'copies',
      header: 'Exemplares',
      align: 'right',
      render: (book) => book.copies,
    },
    {
      key: 'actions',
      header: 'Ações',
      align: 'right',
      render: (book) => (
        <div className="flex justify-end gap-2">
          <button
            type="button"
            aria-label={`Editar ${book.title}`}
            className="flex size-8 items-center justify-center rounded-lg border border-line bg-surface text-fg hover:bg-surface-hover"
          >
            <Pencil size={14} aria-hidden="true" />
          </button>
          <button
            type="button"
            aria-label={`Excluir ${book.title}`}
            className="flex size-8 items-center justify-center rounded-lg border border-line bg-surface text-fg hover:bg-surface-hover"
          >
            <X size={14} aria-hidden="true" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <Table
      columns={columns}
      rows={books}
      getRowKey={(book) => book.id}
      caption="Livros do acervo"
      emptyState={
        <EmptyState
          title="Nenhum livro encontrado."
          description="Tente alterar os termos da busca."
        />
      }
      footer={
        <Pagination
          page={page}
          totalPages={totalPages}
          onPageChange={onPageChange}
          summary={summary}
        />
      }
      className="shadow-sm"
      tableClassName="min-w-[760px]"
    />
  );
}
