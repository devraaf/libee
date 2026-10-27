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
import RegisterBookModal from './components/RegisterBookModal';

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

  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false);
  const [successToast, setSuccessToast] = useState<string | null>(null);

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

        // Combina com livros recém-criados do localStorage
        const savedBooks = localStorage.getItem('booksList');
        const localBooks = savedBooks ? JSON.parse(savedBooks) : [];

        const savedCopies = localStorage.getItem('copiesList');
        const localCopies = savedCopies ? JSON.parse(savedCopies) : copies;

        const formattedLocalBooks: BookCollectionItem[] = localBooks.map((b: any) => ({
          id: b.id,
          title: b.title,
          authors: Array.isArray(b.authors) ? b.authors.map((a: any) => a.name).join(', ') : b.authors,
          isbn: b.isbn,
          category: b.category?.name || 'Geral',
          copies: localCopies.filter((c: any) => c.bookId === b.id).length,
          coverImageUrl: b.coverImageUrl,
        }));

        const combinedItems = [...formattedLocalBooks, ...result.items.map((book) => toBookCollectionItem(book, localCopies))];

        setBooks(combinedItems);
        setTotalBooks(result.totalItems + formattedLocalBooks.length);
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

        const savedCopies = localStorage.getItem('copiesList');
        const currentCopies = savedCopies ? JSON.parse(savedCopies) : copies;

        const savedBooks = localStorage.getItem('booksList');
        const localBooksCount = savedBooks ? JSON.parse(savedBooks).length : 0;

        setStats({
          totalBooks: bookResult.totalItems + localBooksCount,
          totalCopies: currentCopies.length,
          availableCopies: currentCopies.filter((copy: any) => copy.status === 'AVAILABLE').length,
          borrowedCopies: currentCopies.filter((copy: any) => copy.status === 'ON_LOAN').length,
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

  // Recebe o novo livro cadastrado e coloca-o imediatamente no topo da tabela
  const handleBookRegisteredSuccess = (newBook: any) => {
    setIsRegisterModalOpen(false);

    const newCollectionItem: BookCollectionItem = {
      id: newBook.id,
      title: newBook.title,
      authors: newBook.authors.map((a: any) => a.name).join(', '),
      isbn: newBook.isbn,
      category: newBook.category.name,
      copies: newBook.copiesCount, // Exibe o número exato de exemplares cadastrados
      coverImageUrl: newBook.coverImageUrl,
    };

    setBooks((prevBooks) => [newCollectionItem, ...prevBooks]);
    setStatsRetry((r) => r + 1);

    setSuccessToast(`Livro "${newBook.title}" cadastrado com sucesso!`);
    setTimeout(() => setSuccessToast(null), 4000);
  };

  return (
    <section className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-6 px-4 py-8 sm:px-8 relative">
      {successToast && (
        <div className="fixed bottom-5 right-5 z-50 rounded-lg bg-emerald-600 px-4 py-3 text-sm font-medium text-white shadow-lg transition-all">
          {successToast}
        </div>
      )}

      <PageHeader
        title="Acervo"
        subtitle="Gerencie livros e exemplares da biblioteca"
        action={
          <Button
            type="button"
            leftIcon={<Plus size={16} />}
            onClick={() => setIsRegisterModalOpen(true)}
          >
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

      <RegisterBookModal
        open={isRegisterModalOpen}
        onClose={() => setIsRegisterModalOpen(false)}
        onSuccess={handleBookRegisteredSuccess}
      />
    </section>
  );
}