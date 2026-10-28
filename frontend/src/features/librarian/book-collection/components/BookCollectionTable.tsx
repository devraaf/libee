import { Pencil, X } from 'lucide-react';
import { IconButton } from '../../../../shared/components/ui/IconButton';
import { EmptyState } from '../../../../shared/components/ui/EmptyState';
import {
  Table,
  type TableColumn,
} from '../../../../shared/components/ui/Table';
import { Pagination } from '../../../../shared/components/ui/Pagination';
import { CoverImage } from '../../../../shared/components/ui/CoverImage';

export interface BookCollectionItem {
  id: number;
  title: string;
  authors: string;
  isbn: string;
  category: string;
  copies: number;
  hasActiveLoan: boolean;
  coverImageUrl: string | null;
}

export interface BookCollectionTableProps {
  books: BookCollectionItem[];
  page: number;
  totalItems: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  onViewBook?: (bookId: number) => void;
  onEditBook?: (bookId: number) => void;
  onDeleteBook?: (book: BookCollectionItem) => void;
}

export function BookCollectionTable({
  books,
  page,
  totalItems,
  totalPages,
  onPageChange,
  onViewBook,
  onEditBook,
  onDeleteBook,
}: BookCollectionTableProps) {
  const summary = `Mostrando ${books.length} de ${totalItems} ${
    totalItems === 1 ? 'livro' : 'livros'
  }`;
  const columns: TableColumn<BookCollectionItem>[] = [
    {
      key: 'cover',
      header: 'Capa',
      render: (book) => (
        <CoverImage
          src={book.coverImageUrl}
          alt={`Capa de ${book.title}`}
          className="h-12 w-9 rounded"
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
          <IconButton
            label={`Editar ${book.title}`}
            icon={<Pencil size={14} aria-hidden="true" />}
            variant="table"
            size="table"
            onClick={() => onEditBook?.(book.id)}
          />
          <IconButton
            label={`Excluir ${book.title}`}
            icon={<X size={14} aria-hidden="true" />}
            variant="table"
            size="table"
            onClick={() => onDeleteBook?.(book)}
            title={
              book.hasActiveLoan
                ? 'Não é possível excluir um livro com empréstimo ativo.'
                : `Excluir ${book.title}`
            }
            disabled={book.hasActiveLoan}
          />
        </div>
      ),
    },
  ];

  return (
    <Table
      columns={columns}
      rows={books}
      getRowKey={(book) => book.id}
      getRowLabel={(book) => `Ver detalhes de ${book.title}`}
      onRowClick={(book) => onViewBook?.(book.id)}
      caption="Livros do acervo"
      emptyState={
        <EmptyState
          title="Nenhum resultado encontrado"
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
