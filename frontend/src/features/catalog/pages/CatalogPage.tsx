import { useEffect, useState } from 'react';
import { Button } from '@/shared/components/ui/Button';
import { EmptyState } from '@/shared/components/ui/EmptyState';
import { Pagination } from '@/shared/components/ui/Pagination';
import SearchFilterBar from '@/shared/components/ui/SearchFilterBar';
import type {
  Category,
  BookListItem,
  PaginatedResult,
} from '@/shared/types/library';
import { listBooks } from '../services/books.service';
import { listCategories } from '../services/catalog.service';
import { BookCard } from '../components/BookCard';
import { PageHeader } from '@/shared/components/ui/PageHeader';

const PAGE_SIZE = 10;

function getErrorMessage(error: unknown): string {
  return error instanceof Error
    ? error.message
    : 'Não foi possível carregar os livros do acervo.';
}

export function CatalogPage() {
  const [search, setSearch] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [page, setPage] = useState(1);
  const [result, setResult] = useState<PaginatedResult<BookListItem> | null>(
    null,
  );
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    let active = true;

    async function loadCatalog() {
      setIsLoading(true);
      setError(null);
      try {
        const [books, availableCategories] = await Promise.all([
          listBooks({
            page,
            size: PAGE_SIZE,
            search,
            categoryId: categoryId ? Number(categoryId) : undefined,
          }),
          listCategories(),
        ]);
        if (!active) return;
        setResult(books);
        setCategories(availableCategories);
      } catch (loadError) {
        if (active) setError(getErrorMessage(loadError));
      } finally {
        if (active) setIsLoading(false);
      }
    }

    void loadCatalog();
    return () => {
      active = false;
    };
  }, [categoryId, page, retryCount, search]);

  function updateSearch(value: string) {
    setSearch(value);
    setPage(1);
  }

  function updateCategory(value: string) {
    setCategoryId(value);
    setPage(1);
  }

  function retryLoading() {
    setRetryCount((current) => current + 1);
  }

  return (
    <section className="relative mx-auto flex w-full max-w-7xl flex-1 flex-col gap-6 px-4 py-8 sm:px-8">
      <PageHeader title="Acervo" subtitle="Confira os livros da biblioteca" />

      <div className="flex flex-col items-start gap-6 lg:flex-row">
        <div className="flex min-w-0 flex-1 flex-col gap-6">
          <SearchFilterBar
            placeholder="Pesquise por título, autor..."
            value={search}
            onChange={updateSearch}
            filterContent={
              <>
                <label
                  htmlFor="catalog-category"
                  className="type-caption mb-2 block text-muted"
                >
                  Categoria
                </label>
                <select
                  id="catalog-category"
                  value={categoryId}
                  onChange={(event) => updateCategory(event.target.value)}
                  className="h-10 w-full rounded-xl border border-line bg-surface px-3 text-sm text-fg"
                >
                  <option value="">Todas as categorias</option>
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </>
            }
          />

          {isLoading ? (
            <div
              aria-label="Carregando livros"
              aria-busy="true"
              className="grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5"
            >
              {Array.from({ length: PAGE_SIZE }, (_, index) => (
                <div
                  key={index}
                  className="animate-pulse rounded-xl border border-line bg-surface p-2"
                >
                  <div className="aspect-3/4 rounded-lg bg-placeholder-a" />
                  <div className="mt-3 h-4 w-4/5 rounded bg-placeholder-a" />
                  <div className="mt-2 h-3 w-3/5 rounded bg-placeholder-a" />
                  <div className="mt-3 h-6 w-2/5 rounded-full bg-placeholder-a" />
                </div>
              ))}
            </div>
          ) : error ? (
            <EmptyState
              title="Não foi possível carregar o acervo"
              description={error}
              action={<Button onClick={retryLoading}>Tentar novamente</Button>}
            />
          ) : result && result.items.length === 0 ? (
            <EmptyState
              title="Nenhum livro encontrado"
              description="Tente alterar a busca ou escolher outra categoria."
            />
          ) : (
            <>
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
                {result?.items.map((book) => (
                  <BookCard key={book.id} book={book} />
                ))}
              </div>
              {result && result.totalPages > 0 && (
                <Pagination
                  page={result.page}
                  totalPages={result.totalPages}
                  onPageChange={setPage}
                  summary={`Mostrando ${result.items.length} de ${result.totalItems} livros`}
                  className="mt-6"
                />
              )}
            </>
          )}
        </div>

        <aside className="w-full shrink-0 rounded-xl bg-surface-warm p-4 lg:w-64">
          <h2 className="type-small font-semibold text-fg">
            Próximas devoluções
          </h2>
          <p className="type-caption mt-3 text-muted">
            Este painel estará disponível em breve.
          </p>
        </aside>
      </div>
    </section>
  );
}
