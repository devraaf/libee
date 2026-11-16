import { useEffect, useState } from 'react';
import { Button } from '@/shared/components/ui/Button';
import { EmptyState } from '@/shared/components/ui/EmptyState';
import { Pagination } from '@/shared/components/ui/Pagination';
import SearchFilterBar from '@/shared/components/ui/SearchFilterBar';
import type { Category, PageResponse } from '@/shared/types/library';
import type { BookDisplay } from '@/shared/types/library';
import { listReaderBooks } from '../../services/reader-api.service';
import { listCategories } from '@/shared/services/categories.service';
import { BookCard } from '../components/BookCard';
import { PageHeader } from '@/shared/components/ui/PageHeader';
import { UpcomingReturnsPanel } from '../components/UpcomingReturnsPanel';

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
  const [result, setResult] = useState<PageResponse<BookDisplay> | null>(null);
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
          listReaderBooks({
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
          <div
            role="region"
            aria-label="Acervo"
            aria-busy={isLoading}
            className="rounded-2xl bg-bg-secondary p-3 sm:p-5"
          >
            {isLoading && !result ? (
              <div
                aria-label="Carregando livros"
                aria-busy="true"
                role="status"
              >
                <p className="type-caption mb-3 text-muted sm:mb-4">
                  Carregando acervo...
                </p>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 xl:grid-cols-4 2xl:grid-cols-5">
                  {Array.from({ length: PAGE_SIZE }, (_, index) => (
                    <div
                      key={index}
                      aria-hidden="true"
                      className={`animate-pulse rounded-xl border border-line bg-surface p-2 ${
                        index >= 4 ? 'hidden sm:block' : ''
                      } ${index >= 6 ? 'sm:hidden xl:block' : ''} ${
                        index >= 8 ? 'xl:hidden 2xl:block' : ''
                      }`}
                    >
                      <div className="aspect-3/4 rounded-lg bg-placeholder-a" />
                      <div className="mt-3 h-4 w-4/5 rounded bg-placeholder-a" />
                      <div className="mt-2 h-3 w-3/5 rounded bg-placeholder-a" />
                      <div className="mt-3 h-6 w-2/5 rounded-full bg-placeholder-a" />
                    </div>
                  ))}
                </div>
              </div>
            ) : !result && error ? (
              <EmptyState
                title="Não foi possível carregar o acervo"
                description={error}
                action={
                  <Button onClick={retryLoading}>Tentar novamente</Button>
                }
              />
            ) : result ? (
              <>
                {isLoading && (
                  <span role="status" className="sr-only">
                    Atualizando resultados...
                  </span>
                )}
                {error && (
                  <div
                    role="alert"
                    className="mb-4 flex flex-col gap-3 rounded-xl border border-line bg-surface p-3 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <p className="type-small text-muted">
                      Não foi possível atualizar o acervo: {error}
                    </p>
                    <Button onClick={retryLoading} size="sm">
                      Tentar novamente
                    </Button>
                  </div>
                )}
                {result.content.length > 0 ? (
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 xl:grid-cols-4 2xl:grid-cols-5">
                    {result.content.map((book) => (
                      <BookCard key={book.id} book={book} />
                    ))}
                  </div>
                ) : (
                  <EmptyState
                    title="Nenhum livro encontrado"
                    description="Tente alterar a busca ou escolher outra categoria."
                  />
                )}
                {result.totalPages > 0 && (
                  <Pagination
                    page={result.page}
                    totalPages={result.totalPages}
                    onPageChange={setPage}
                    summary={`Mostrando ${result.content.length} de ${result.totalElements} livros`}
                    className="mt-4 border-t border-line pt-4 sm:mt-5 sm:pt-5"
                  />
                )}
              </>
            ) : null}
          </div>
        </div>
        <UpcomingReturnsPanel />
      </div>
    </section>
  );
}
