import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus } from 'lucide-react';
import { Button } from '@/shared/components/ui/Button';
import { EmptyState } from '@/shared/components/ui/EmptyState';
import { PageHeader } from '@/shared/components/ui/PageHeader';
import SearchFilterBar from '@/shared/components/ui/SearchFilterBar';
import { Select } from '@/shared/components/ui/Select';
import { ApiError } from '@/shared/api/api-error';
import { listCategories } from '@/shared/services/categories.service';
import {
  deleteManagedBook,
  getBookManagementSummary,
  listManagedBooks,
} from '../services/book-management.service';
import type {
  BookManagementSummaryDto,
  RegisteredBookDto,
} from '../types/book-management';
import { BookCollectionStats } from '../components/BookCollectionStats';
import {
  BookCollectionTable,
  type BookCollectionItem,
} from '../components/BookCollectionTable';
import DeleteBookModal from '../components/DeleteBookModal';
import EditBookModal from '../components/EditBookModal';
import RegisterBookModal from '../components/RegisterBookModal';
import { LoadingState } from '../../shared/components/LoadingState';
import { SuccessToast } from '../../shared/components/SuccessToast';
import {
  usePaginatedManagementList,
  type ManagementListParams,
} from '../../shared/hooks/usePaginatedManagementList';
import { useTransientMessage } from '../../shared/hooks/useTransientMessage';
import { getErrorMessage } from '../../shared/utils/error-message';

const PAGE_SIZE = 10;

export default function BookCollectionPage() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [page, setPage] = useState(1);
  const [categories, setCategories] = useState<
    Array<{ id: number; name: string }>
  >([]);
  const [summary, setSummary] = useState<BookManagementSummaryDto | null>(null);
  const [categoriesError, setCategoriesError] = useState<string | null>(null);
  const [categoriesLoading, setCategoriesLoading] = useState(true);
  const [categoriesRetry, setCategoriesRetry] = useState(0);
  const [summaryError, setSummaryError] = useState<string | null>(null);
  const [refresh, setRefresh] = useState(0);
  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false);
  const [editingBookId, setEditingBookId] = useState<number | null>(null);
  const [bookToDelete, setBookToDelete] = useState<BookCollectionItem | null>(
    null,
  );
  const [isDeletingBook, setIsDeletingBook] = useState(false);
  const [deleteBookError, setDeleteBookError] = useState<string | null>(null);
  const [blockedAccessionNumbers, setBlockedAccessionNumbers] = useState<
    string[]
  >([]);
  const { message: successToast, setMessage: setSuccessToast } =
    useTransientMessage();

  useEffect(() => {
    let active = true;
    listCategories()
      .then((result) => {
        if (active) {
          setCategories(result);
          setCategoriesError(null);
        }
      })
      .catch((error: unknown) => {
        if (active) {
          setCategoriesError(
            getErrorMessage(
              error,
              'Não foi possível carregar os dados do acervo.',
            ),
          );
        }
      })
      .finally(() => {
        if (active) setCategoriesLoading(false);
      });

    return () => {
      active = false;
    };
  }, [categoriesRetry]);

  const loadBooks = useCallback(
    async ({ page, size, search }: ManagementListParams) => {
      const category = categories.find(({ name }) => name === categoryFilter);
      const result = await listManagedBooks({
        page,
        size,
        search,
        categoryId: category?.id,
      });
      return {
        ...result,
        content: result.content.map((book) => ({
          id: book.id,
          title: book.title,
          authors: book.authors.join(', '),
          isbn: book.isbn,
          category: book.category,
          copies: book.totalCopies,
          availableCopies: book.availableCopies,
          coverImageUrl: book.coverImageUrl,
        })),
      };
    },
    [categories, categoryFilter],
  );
  const {
    items: books,
    totalItems,
    totalPages,
    isLoading: isLoadingBooks,
    error: booksError,
  } = usePaginatedManagementList({
    page,
    size: PAGE_SIZE,
    search,
    refreshKey: refresh,
    loadPage: loadBooks,
    errorFallback: 'Não foi possível carregar os dados do acervo.',
  });

  useEffect(() => {
    let active = true;
    getBookManagementSummary()
      .then((result) => {
        if (active) {
          setSummary(result);
          setSummaryError(null);
        }
      })
      .catch((error: unknown) => {
        if (active) {
          setSummaryError(
            getErrorMessage(
              error,
              'Não foi possível carregar os dados do acervo.',
            ),
          );
        }
      });

    return () => {
      active = false;
    };
  }, [refresh]);

  function refreshCollection() {
    setSummary(null);
    setRefresh((current) => current + 1);
  }

  function handleBookRegisteredSuccess(newBook: RegisteredBookDto) {
    setIsRegisterModalOpen(false);
    setSearch('');
    setCategoryFilter('');
    setPage(1);
    refreshCollection();
    setSuccessToast(`Livro "${newBook.title}" cadastrado com sucesso.`);
  }

  async function handleDeleteBook() {
    if (!bookToDelete) return;
    setIsDeletingBook(true);
    setDeleteBookError(null);
    try {
      await deleteManagedBook(bookToDelete.id);
      setBookToDelete(null);
      refreshCollection();
      setSuccessToast(`Livro "${bookToDelete.title}" excluído com sucesso.`);
    } catch (error) {
      setDeleteBookError(
        getErrorMessage(error, 'Não foi possível carregar os dados do acervo.'),
      );
      if (error instanceof ApiError) {
        setBlockedAccessionNumbers(error.accessionNumbers);
      }
    } finally {
      setIsDeletingBook(false);
    }
  }

  function handleCloseDeleteModal() {
    if (isDeletingBook) return;
    setBookToDelete(null);
    setDeleteBookError(null);
    setBlockedAccessionNumbers([]);
  }

  return (
    <section className="relative mx-auto flex w-full max-w-7xl flex-1 flex-col gap-6 px-4 py-8 sm:px-8">
      <SuccessToast message={successToast} />

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

      <BookCollectionStats
        totalBooks={summary?.totalBooks}
        totalCopies={summary?.totalCopies}
        availableCopies={summary?.availableCopies}
        borrowedCopies={summary?.onLoanCopies}
      />
      {summaryError && (
        <p className="type-small text-danger" role="alert">
          Não foi possível carregar os cards: {summaryError}
        </p>
      )}

      <SearchFilterBar
        placeholder="Pesquise por título, autor ou ISBN..."
        value={search}
        onChange={(value) => {
          setSearch(value);
          setPage(1);
        }}
        filterContent={
          <Select
            density="compact"
            label="Categoria"
            value={categoryFilter}
            onChange={(event) => {
              setCategoryFilter(event.target.value);
              setPage(1);
            }}
            placeholder="Todas as categorias"
            placeholderDisabled={false}
            options={categories.map((category) => ({
              value: category.name,
              label: category.name,
            }))}
          />
        }
      />
      {categoriesError && (
        <p className="type-small text-danger" role="alert">
          Não foi possível carregar as categorias: {categoriesError}
        </p>
      )}

      {isLoadingBooks ? (
        <LoadingState label="Carregando acervo" />
      ) : booksError ? (
        <EmptyState
          title="Não foi possível carregar o acervo."
          description={booksError}
          action={
            <Button type="button" variant="outline" onClick={refreshCollection}>
              Tentar novamente
            </Button>
          }
        />
      ) : (
        <BookCollectionTable
          books={books}
          page={page}
          totalItems={totalItems}
          totalPages={totalPages}
          onPageChange={setPage}
          onViewBook={(bookId) => navigate(`/livros/${bookId}`)}
          onEditBook={setEditingBookId}
          onDeleteBook={(book) => {
            setBookToDelete(book);
            setDeleteBookError(null);
            setBlockedAccessionNumbers([]);
          }}
        />
      )}

      <RegisterBookModal
        open={isRegisterModalOpen}
        onClose={() => setIsRegisterModalOpen(false)}
        onSuccess={handleBookRegisteredSuccess}
        categories={categories}
        categoriesLoading={categoriesLoading}
        categoriesError={categoriesError}
        onRetryCategories={() => {
          setCategoriesLoading(true);
          setCategoriesRetry((current) => current + 1);
        }}
        onCategoryCreated={(category) =>
          setCategories((current) =>
            current.some(({ id }) => id === category.id)
              ? current
              : [...current, category],
          )
        }
      />

      <EditBookModal
        open={editingBookId !== null}
        bookId={editingBookId}
        categories={categories}
        categoriesLoading={categoriesLoading}
        categoriesError={categoriesError}
        onRetryCategories={() => {
          setCategoriesLoading(true);
          setCategoriesRetry((current) => current + 1);
        }}
        onCategoryCreated={(category) =>
          setCategories((current) =>
            current.some(({ id }) => id === category.id)
              ? current
              : [...current, category],
          )
        }
        onClose={() => setEditingBookId(null)}
        onCopyDeleted={refreshCollection}
      />

      <DeleteBookModal
        open={bookToDelete !== null}
        bookTitle={bookToDelete?.title ?? null}
        isDeleting={isDeletingBook}
        error={deleteBookError}
        blockedAccessionNumbers={blockedAccessionNumbers}
        onClose={handleCloseDeleteModal}
        onConfirm={handleDeleteBook}
      />
    </section>
  );
}
