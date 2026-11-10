import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import type { PageResponse } from '@/shared/types/library';
import type { BookDisplay } from '@/shared/types/library';

const { listReaderBooks, listCategories } = vi.hoisted(() => ({
  listReaderBooks: vi.fn(),
  listCategories: vi.fn(),
}));

vi.mock('@/features/reader/services/reader-api.service', () => ({
  listReaderBooks,
}));

vi.mock('@/shared/services/categories.service', () => ({ listCategories }));

vi.mock('@/features/reader/catalog/components/UpcomingReturnsPanel', () => ({
  UpcomingReturnsPanel: () => null,
}));

import { CatalogPage } from '@/features/reader/catalog/pages/CatalogPage';

const book: BookDisplay = {
  id: 1,
  title: 'Clean Code',
  authors: ['Robert C. Martin'],
  category: { id: 1, name: 'Tecnologia' },
  isbn: '9780132350884',
  publisher: null,
  publicationPlace: null,
  edition: null,
  coverImageUrl: null,
  publicationDate: null,
  pageCount: null,
  summary: null,
  available: true,
};

function page(
  content: BookDisplay[],
  currentPage: number,
  totalPages: number,
): PageResponse<BookDisplay> {
  return {
    content,
    page: currentPage,
    size: 10,
    totalElements: totalPages * 10,
    totalPages,
  };
}

function renderCatalog() {
  return render(
    <MemoryRouter>
      <CatalogPage />
    </MemoryRouter>,
  );
}

beforeEach(() => {
  vi.resetAllMocks();
  listCategories.mockResolvedValue([]);
});

afterEach(cleanup);

describe('CatalogPage API states', () => {
  it('shows a compact responsive loading state before results load', () => {
    listReaderBooks.mockReturnValue(new Promise(() => {}));

    renderCatalog();

    expect(
      screen.getByRole('status', { name: 'Carregando livros' }),
    ).toBeTruthy();
    expect(screen.getByText('Carregando acervo...')).toBeTruthy();
    const loading = screen.getByRole('status', { name: 'Carregando livros' });
    expect(screen.getByRole('region', { name: 'Acervo' }).className).toContain(
      'rounded-2xl bg-bg-secondary',
    );
    const skeletons = loading.querySelectorAll('[aria-hidden="true"]');
    expect(skeletons).toHaveLength(10);
    expect(skeletons.item(3).className).not.toContain('hidden');
    expect(skeletons.item(4).className).toContain('hidden sm:block');
  });

  it('shows the empty state when the search has no results', async () => {
    listReaderBooks.mockResolvedValue(page([], 1, 0));

    renderCatalog();

    expect(await screen.findByText('Nenhum livro encontrado')).toBeTruthy();
    expect(screen.getByRole('region', { name: 'Acervo' }).className).toContain(
      'rounded-2xl bg-bg-secondary',
    );
  });

  it('shows an error and allows retrying', async () => {
    listReaderBooks
      .mockRejectedValueOnce(new Error('Falha ao buscar livros'))
      .mockResolvedValueOnce(page([], 1, 0));

    renderCatalog();

    expect(await screen.findByText('Falha ao buscar livros')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Tentar novamente' }));
    await waitFor(() => expect(listReaderBooks).toHaveBeenCalledTimes(2));
  });

  it('requests and renders the selected page', async () => {
    listReaderBooks
      .mockResolvedValueOnce(page([book], 1, 2))
      .mockResolvedValueOnce(
        page([{ ...book, id: 2, title: 'Clean Architecture' }], 2, 2),
      );

    renderCatalog();

    expect(await screen.findByText('Clean Code')).toBeTruthy();
    const results = screen.getByRole('region', { name: 'Acervo' });
    expect(
      within(results).getByRole('navigation', { name: 'Paginação' }),
    ).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: '2' }));

    expect(await screen.findByText('Clean Architecture')).toBeTruthy();
    expect(listReaderBooks).toHaveBeenLastCalledWith({
      page: 2,
      size: 10,
      search: '',
      categoryId: undefined,
    });
  });

  it('keeps the previous page visible while the next page is loading', async () => {
    let resolveNextPage!: (response: PageResponse<BookDisplay>) => void;
    listReaderBooks
      .mockResolvedValueOnce(page([book], 1, 2))
      .mockImplementationOnce(
        () =>
          new Promise((resolve) => {
            resolveNextPage = resolve;
          }),
      );

    renderCatalog();

    expect(await screen.findByText('Clean Code')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: '2' }));

    expect(screen.getByText('Clean Code')).toBeTruthy();
    expect(screen.getByRole('status').textContent).toContain(
      'Atualizando resultados...',
    );
    expect(screen.queryByText('Carregando acervo...')).toBeNull();

    resolveNextPage(
      page([{ ...book, id: 2, title: 'Clean Architecture' }], 2, 2),
    );

    expect(await screen.findByText('Clean Architecture')).toBeTruthy();
    expect(screen.queryByText('Clean Code')).toBeNull();
  });

  it('keeps the previous results visible when an update fails', async () => {
    listReaderBooks
      .mockResolvedValueOnce(page([book], 1, 2))
      .mockRejectedValueOnce(new Error('Falha ao atualizar'));

    renderCatalog();

    expect(await screen.findByText('Clean Code')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: '2' }));

    expect((await screen.findByRole('alert')).textContent).toContain(
      'Falha ao atualizar',
    );
    expect(screen.getByText('Clean Code')).toBeTruthy();
    expect(
      screen.getByRole('button', { name: 'Tentar novamente' }),
    ).toBeTruthy();
  });
});
