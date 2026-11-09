import {
  deleteBook,
  listActiveCopies,
  listAllBooks,
  type RegisteredBook,
} from '@/features/reader/catalog/services/books.service';
import { listLoans } from '@/features/loans/services/loans.service';
import { Button } from '@/shared/components/ui/Button';
import { EmptyState } from '@/shared/components/ui/EmptyState';
import { Loader } from '@/shared/components/ui/loader/Loader';
import { PageHeader } from '@/shared/components/ui/PageHeader';
import SearchFilterBar from '@/shared/components/ui/SearchFilterBar';
import { useTableData } from '@/shared/hooks/useTableData';
import type { BookListItem, Copy } from '@/shared/types/library';
import { Plus } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BookCollectionStats } from '../components/BookCollectionStats';
import {
  BookCollectionTable,
  type BookCollectionItem,
} from '../components/BookCollectionTable';
import DeleteBookModal from '../components/DeleteBookModal';
import EditBookModal from '../components/EditBookModal';
import RegisterBookModal from '../components/RegisterBookModal';

interface BookCollectionStatsData {
  totalBooks: number;
  totalCopies: number;
  availableCopies: number;
  borrowedCopies: number;
}

function toBookCollectionItem(
  book: BookListItem,
  copies: Copy[],
  activeCopyIds: Set<number>,
): BookCollectionItem {
  const bookCopies = copies.filter((copy) => copy.bookId === book.id);
  return {
    id: book.id,
    title: book.title,
    authors: book.authors.map(({ name }) => name).join(', '),
    isbn: book.isbn,
    category: book.category.name,
    copies: bookCopies.length,
    hasActiveLoan: bookCopies.some((copy) => activeCopyIds.has(copy.id)),
    coverImageUrl: book.coverImageUrl,
  };
}

function getErrorMessage(error: unknown): string {
  return error instanceof Error
    ? error.message
    : 'Não foi possível carregar os dados do acervo.';
}

export default function BookCollectionPage() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [books, setBooks] = useState<BookCollectionItem[]>([]);
  const [isLoadingBooks, setIsLoadingBooks] = useState(true);
  const [booksError, setBooksError] = useState<string | null>(null);
  const [booksRetry, setBooksRetry] = useState(0);
  const [stats, setStats] = useState<BookCollectionStatsData>();

  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false);
  const [editingBookId, setEditingBookId] = useState<number | null>(null);
  const [bookToDelete, setBookToDelete] = useState<BookCollectionItem | null>(
    null,
  );
  const [isDeletingBook, setIsDeletingBook] = useState(false);
  const [deleteBookError, setDeleteBookError] = useState<string | null>(null);
  const [successToast, setSuccessToast] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    async function loadBooks() {
      setIsLoadingBooks(true);
      setBooksError(null);
      try {
        const [bookRecords, copies, loans] = await Promise.all([
          listAllBooks(),
          listActiveCopies(),
          listLoans(),
        ]);
        if (!active) return;

        const activeCopyIds = new Set(
          loans
            .filter((loan) => loan.returnDate === null)
            .map((loan) => loan.copyId),
        );
        setBooks(
          bookRecords.map((book) =>
            toBookCollectionItem(book, copies, activeCopyIds),
          ),
        );
        setStats({
          totalBooks: bookRecords.length,
          totalCopies: copies.length,
          availableCopies: copies.filter((copy) => copy.status === 'AVAILABLE')
            .length,
          borrowedCopies: copies.filter((copy) => copy.status === 'ON_LOAN')
            .length,
        });
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
  }, [booksRetry]);

  const tableData = useTableData({
    data: books,
    search,
    getSearchText: (book) => [book.title, book.authors, book.isbn],
    filters: { category: categoryFilter },
    matchesFilters: (book, filters) =>
      !filters.category || book.category === filters.category,
  });

  const categories = [...new Set(books.map((book) => book.category))];

  const handleBookRegisteredSuccess = (newBook: RegisteredBook) => {
    setIsRegisterModalOpen(false);
    setSearch('');
    setCategoryFilter('');
    setBooksRetry((retry) => retry + 1);

    setSuccessToast(`Livro "${newBook.title}" cadastrado com sucesso!`);
    setTimeout(() => setSuccessToast(null), 4000);
  };

  const handleDeleteBook = async () => {
    if (!bookToDelete) return;
    setIsDeletingBook(true);
    setDeleteBookError(null);
    try {
      await deleteBook(bookToDelete.id);
      setBookToDelete(null);
      setBooksRetry((retry) => retry + 1);
      setSuccessToast(`Livro "${bookToDelete.title}" excluído com sucesso.`);
      setTimeout(() => setSuccessToast(null), 4000);
    } catch (error) {
      setDeleteBookError(
        error instanceof Error
          ? error.message
          : 'Não foi possível excluir o livro.',
      );
    } finally {
      setIsDeletingBook(false);
    }
  };

  const handleCloseDeleteModal = () => {
    if (isDeletingBook) return;
    setBookToDelete(null);
    setDeleteBookError(null);
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
      <SearchFilterBar
        placeholder="Pesquise por título, autor ou ISBN..."
        value={search}
        onChange={setSearch}
        filterContent={
          <label className="flex flex-col gap-2 text-sm text-fg">
            Categoria
            <select
              value={categoryFilter}
              onChange={(event) => setCategoryFilter(event.target.value)}
              className="rounded-lg border border-line bg-surface px-3 py-2 text-sm"
            >
              <option value="">Todas as categorias</option>
              {categories.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
          </label>
        }
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
          books={tableData.items}
          page={tableData.page}
          totalItems={tableData.totalItems}
          totalPages={tableData.totalPages}
          onPageChange={tableData.setPage}
          onViewBook={(bookId) => navigate(`/livros/${bookId}`)}
          onEditBook={setEditingBookId}
          onDeleteBook={(book) => {
            setBookToDelete(book);
            setDeleteBookError(null);
          }}
        />
      )}

      <RegisterBookModal
        open={isRegisterModalOpen}
        onClose={() => setIsRegisterModalOpen(false)}
        onSuccess={handleBookRegisteredSuccess}
        onOpenEditModal={setEditingBookId}
      />

      <EditBookModal
        open={editingBookId !== null}
        bookId={editingBookId}
        onClose={() => setEditingBookId(null)}
        onSuccess={(updatedBook) => {
          setEditingBookId(null);
          setBooksRetry((retry) => retry + 1);
          setSuccessToast(
            `Livro "${updatedBook.title}" atualizado com sucesso!`,
          );
          setTimeout(() => setSuccessToast(null), 4000);
        }}
      />

      <DeleteBookModal
        open={bookToDelete !== null}
        bookTitle={bookToDelete?.title ?? null}
        isDeleting={isDeletingBook}
        error={deleteBookError}
        onClose={handleCloseDeleteModal}
        onConfirm={handleDeleteBook}
      />
    </section>
  );
}
