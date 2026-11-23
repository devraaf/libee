import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const {
  deleteManagedBook,
  getBookManagementSummary,
  listCategories,
  listManagedBooks,
  getBookDetails,
} = vi.hoisted(() => ({
  deleteManagedBook: vi.fn(),
  getBookManagementSummary: vi.fn(),
  listCategories: vi.fn(),
  listManagedBooks: vi.fn(),
  getBookDetails: vi.fn(),
}));

vi.mock('@/shared/services/categories.service', () => ({
  listCategories,
  createCategory: vi.fn(),
}));

vi.mock('../services/book-management.service', () => ({
  deleteManagedBook,
  getBookManagementSummary,
  listManagedBooks,
}));

vi.mock('@/features/book-details/services/books.service', () => ({
  getBookDetails,
}));

import BookCollectionPage from './BookCollectionPage';

describe('BookCollectionPage', () => {
  afterEach(() => cleanup());

  beforeEach(() => {
    vi.resetAllMocks();
    listCategories.mockResolvedValue([{ id: 3, name: 'Tecnologia' }]);
    getBookManagementSummary.mockResolvedValue({
      totalBooks: 1,
      totalCopies: 2,
      availableCopies: 1,
      onLoanCopies: 1,
    });
    listManagedBooks.mockResolvedValue({
      content: [
        {
          id: 8,
          title: 'Clean Code',
          authors: ['Robert C. Martin'],
          isbn: '9780132350884',
          category: 'Tecnologia',
          coverImageUrl: null,
          totalCopies: 2,
          availableCopies: 1,
        },
      ],
      page: 1,
      size: 10,
      totalElements: 1,
      totalPages: 1,
    });
    getBookDetails.mockResolvedValue({
      book: {
        id: 8,
        title: 'Clean Code',
        isbn: '9780132350884',
        category: { id: 3, name: 'Tecnologia' },
        authors: ['Robert C. Martin'],
        publisher: 'Prentice Hall',
        publicationPlace: 'New York',
        edition: '1ª',
        coverImageUrl: 'https://example.com/cover.jpg',
        publicationDate: '2008',
        pageCount: 464,
        summary: 'A handbook of agile software craftsmanship.',
        available: true,
      },
      copies: [],
    });
  });

  it('renders the backend book list and sends search to the management API', async () => {
    render(
      <MemoryRouter>
        <BookCollectionPage />
      </MemoryRouter>,
    );

    expect(await screen.findByText('Clean Code')).toBeTruthy();
    expect(
      screen.getByRole('columnheader', { name: 'Disponíveis' }),
    ).toBeTruthy();
    expect(
      screen.getByRole('button', { name: 'Excluir Clean Code' }),
    ).toHaveProperty('disabled', true);

    fireEvent.change(
      screen.getByPlaceholderText('Pesquise por título, autor ou ISBN...'),
      { target: { value: 'Clean' } },
    );

    await waitFor(() => {
      expect(listManagedBooks).toHaveBeenLastCalledWith({
        page: 1,
        size: 10,
        search: 'Clean',
        categoryId: undefined,
      });
    });
  });

  it('allows deleting a book when none of its copies are on loan', async () => {
    listManagedBooks.mockResolvedValue({
      content: [
        {
          id: 8,
          title: 'Clean Code',
          authors: ['Robert C. Martin'],
          isbn: '9780132350884',
          category: 'Tecnologia',
          coverImageUrl: null,
          totalCopies: 2,
          availableCopies: 2,
        },
      ],
      page: 1,
      size: 10,
      totalElements: 1,
      totalPages: 1,
    });

    render(
      <MemoryRouter>
        <BookCollectionPage />
      </MemoryRouter>,
    );

    expect(await screen.findByText('Clean Code')).toBeTruthy();
    expect(
      screen.getByRole('button', { name: 'Excluir Clean Code' }),
    ).toHaveProperty('disabled', false);
  });

  it('keeps the edit modal open when continuing from book data to copies', async () => {
    render(
      <MemoryRouter>
        <BookCollectionPage />
      </MemoryRouter>,
    );

    fireEvent.click(
      await screen.findByRole('button', { name: 'Editar Clean Code' }),
    );
    expect(
      await screen.findByRole('dialog', { name: 'Editar livro' }),
    ).toBeTruthy();

    fireEvent.click(await screen.findByRole('button', { name: 'Continuar' }));

    expect(
      await screen.findByRole('button', { name: 'Adicionar exemplar' }),
    ).toBeTruthy();
    expect(screen.getByRole('dialog', { name: 'Editar livro' })).toBeTruthy();
  });

  it('shows dashes in the summary cards until the API responds', () => {
    getBookManagementSummary.mockReturnValue(new Promise(() => {}));

    render(
      <MemoryRouter>
        <BookCollectionPage />
      </MemoryRouter>,
    );

    expect(
      screen.getByRole('region', { name: 'Resumo do acervo' }).textContent,
    ).toContain('—');
  });
});
