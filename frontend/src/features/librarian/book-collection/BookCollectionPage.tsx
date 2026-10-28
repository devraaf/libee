import { useEffect, useState } from 'react';
import { Plus } from 'lucide-react';
import { Button } from '../../../shared/components/ui/Button';
import { EmptyState } from '../../../shared/components/ui/EmptyState';
import { Loader } from '../../../shared/components/ui/Loader/Loader';
import { PageHeader } from '../../../shared/components/ui/PageHeader';
import SearchFilterBar from '../../../shared/components/ui/SearchFilterBar';
import { listBooks, listCopies } from '../../catalog/services/books.service';
import type { BookListItem, Copy } from '../../../shared/types/library';
import {
  BookCollectionTable,
  type BookCollectionItem,
} from './components/BookCollectionTable';
import { BookCollectionStats } from './components/BookCollectionStats';

const PAGE_SIZE = 10;

interface BookCollectionStatsData {
  totalBooks: number;
  totalCopies: number;
  availableCopies: number;
  borrowedCopies: number;
}

function toBookCollectionItem(
  book: BookListItem,
  copies: Copy[],
): BookCollectionItem {
  return {
    id: book.id,
    title: book.title,
    authors: book.authors.map(({ name }) => name).join(', '),
    isbn: book.isbn,
    category: book.category.name,
    copies: copies.filter((copy) => copy.bookId === book.id).length,
    coverImageUrl: book.coverImageUrl,
  };
}

function getErrorMessage(error: unknown): string {
  return error instanceof Error
    ? error.message
    : 'Não foi possível carregar os dados do acervo.';
}

export default function BookCollectionPage() {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [books, setBooks] = useState<BookCollectionItem[]>([]);
  const [totalBooks, setTotalBooks] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoadingBooks, setIsLoadingBooks] = useState(true);
  const [booksError, setBooksError] = useState<string | null>(null);
  const [booksRetry, setBooksRetry] = useState(0);
  const [stats, setStats] = useState<BookCollectionStatsData>();
  const [statsError, setStatsError] = useState<string | null>(null);
  const [statsRetry, setStatsRetry] = useState(0);

  useEffect(() => {
    let active = true;

    async function loadBooks() {
      setIsLoadingBooks(true);
      setBooksError(null);
      try {
        const [result, copies] = await Promise.all([
          listBooks({ page, size: PAGE_SIZE, search }),
          listCopies(),
        ]);
        if (!active) return;
        setBooks(
          result.items.map((book) => toBookCollectionItem(book, copies)),
        );
        setTotalBooks(result.totalItems);
        setTotalPages(Math.max(result.totalPages, 1));
      } catch (error) {
        if (active) setBooksError(getErrorMessage(error));
      } finally {
        if (active) setIsLoadingBooks(false);
      }
    }

    void loadBooks();
    return () => {
      active = false;
    };
  }, [page, search, booksRetry]);

  useEffect(() => {
    let active = true;

    async function loadStats() {
      setStatsError(null);
      try {
        const [bookResult, copies] = await Promise.all([
          listBooks({ page: 1, size: 1 }),
          listCopies(),
        ]);
        if (!active) return;
        setStats({
          totalBooks: bookResult.totalItems,
          totalCopies: copies.length,
          availableCopies: copies.filter((copy) => copy.status === 'AVAILABLE')
            .length,
          borrowedCopies: copies.filter((copy) => copy.status === 'ON_LOAN')
            .length,
        });
      } catch (error) {
        if (active) setStatsError(getErrorMessage(error));
      }
    }

    void loadStats();
    return () => {
      active = false;
    };
  }, [statsRetry]);

  function handleSearchChange(value: string) {
    setSearch(value);
    setPage(1);
  }

  return (
    <section className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-6 px-4 py-8 sm:px-8">
      <PageHeader
        title="Acervo"
        subtitle="Gerencie livros e exemplares da biblioteca"
        action={
          <Button type="button" leftIcon={<Plus size={16} />}>
            Cadastrar livro
          </Button>
        }
      />

      <BookCollectionStats {...stats} />
      {statsError && (
        <div
          className="flex flex-wrap items-center justify-between gap-3"
          role="alert"
        >
          <p className="type-small text-danger">{statsError}</p>
          <Button
            type="button"
            variant="outline"
            onClick={() => setStatsRetry((retry) => retry + 1)}
          >
            Tentar carregar resumo novamente
          </Button>
        </div>
      )}

      <SearchFilterBar
        placeholder="Pesquise por título, autor ou ISBN..."
        value={search}
        onChange={handleSearchChange}
      />

      {isLoadingBooks ? (
        <div
          className="flex min-h-48 items-center justify-center"
          role="status"
          aria-label="Carregando acervo"
        >
          <Loader />
        </div>
      ) : booksError ? (
        <EmptyState
          title="Não foi possível carregar o acervo."
          description={booksError}
          action={
            <Button
              type="button"
              variant="outline"
              onClick={() => setBooksRetry((retry) => retry + 1)}
            >
              Tentar novamente
            </Button>
          }
        />
      ) : (
        <BookCollectionTable
          books={books}
          page={page}
          totalItems={totalBooks}
          totalPages={totalPages}
          onPageChange={setPage}
        />
      )}
    </section>
  );
}
