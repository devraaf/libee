import {
  cleanup,
  fireEvent,
  render,
  screen,
  within,
} from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import type { BookDisplay, Copy } from '@/shared/types/library';
import { ApiError } from '@/shared/api/api-error';
import BookDetails from '@/features/book-details/components/BookDetails';

const { getBookDetails } = vi.hoisted(() => ({
  getBookDetails: vi.fn(),
}));

vi.mock('@/features/book-details/services/books.service', () => ({
  getBookDetails,
}));
vi.mock('@/app/providers/auth/useAuth', () => ({
  useAuth: () => ({ session: { user: { profile: 'READER' } } }),
}));

import { BookDetailsPage } from '@/features/book-details/pages/BooksDetailsPage';

const book: BookDisplay = {
  id: 4,
  title: 'Domain-Driven Design',
  authors: ['Eric Evans'],
  category: { id: 1, name: 'Tecnologia' },
  isbn: '9780321125217',
  publisher: 'Addison-Wesley',
  publicationPlace: 'Boston',
  edition: '1ª',
  coverImageUrl: null,
  publicationDate: '2003',
  pageCount: 560,
  summary: 'Uma descrição de exemplo.',
  available: true,
};

const copies: Copy[] = [
  {
    id: 1,
    bookId: book.id,
    accessionNumber: '01010',
    physicalLocation: 'A11',
    status: 'AVAILABLE',
  },
  {
    id: 2,
    bookId: book.id,
    accessionNumber: '01011',
    physicalLocation: 'A11',
    status: 'ON_LOAN',
  },
];

describe('BookDetails', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  afterEach(cleanup);

  it('presents the book information and exemplars with accessible structure', () => {
    render(
      <MemoryRouter>
        <BookDetails book={book} copies={copies} onBack={() => {}} />
      </MemoryRouter>,
    );

    expect(
      screen.getByRole('heading', { level: 1, name: book.title }),
    ).toBeTruthy();
    expect(screen.getByText('Eric Evans')).toBeTruthy();
    expect(screen.getByText('Descrição')).toBeTruthy();
    expect(screen.getByText('Editora')).toBeTruthy();
    expect(screen.getByText('ISBN')).toBeTruthy();
    expect(screen.getByText('Total de exemplares: 2')).toBeTruthy();
    expect(
      screen.getByRole('img', { name: 'Capa de Domain-Driven Design' }),
    ).toHaveProperty(
      'src',
      `${window.location.origin}/images/book-cover-placeholder.svg`,
    );

    const copiesTable = screen.getByRole('region', {
      name: /Tabela de exemplares de Domain-Driven Design/,
    });
    expect(
      within(copiesTable).getByRole('columnheader', { name: 'Tombo' }),
    ).toBeTruthy();
    expect(
      within(copiesTable).getByRole('cell', { name: '01010' }),
    ).toBeTruthy();
    expect(
      within(copiesTable).getByRole('cell', { name: 'Disponível' }),
    ).toBeTruthy();
    expect(copiesTable.getAttribute('tabindex')).toBe('0');
  });

  it('returns to the page that opened the book details', async () => {
    getBookDetails.mockResolvedValue({ book, copies });

    render(
      <MemoryRouter
        initialEntries={['/emprestimos', `/livros/${book.id}`]}
        initialIndex={1}
      >
        <Routes>
          <Route path="/emprestimos" element={<p>Lista de empréstimos</p>} />
          <Route path="/livros/:id" element={<BookDetailsPage />} />
        </Routes>
      </MemoryRouter>,
    );

    expect(
      await screen.findByRole('heading', { level: 1, name: book.title }),
    ).toBeTruthy();
    fireEvent.click(
      screen.getByRole('button', { name: 'Voltar à página anterior' }),
    );

    expect(await screen.findByText('Lista de empréstimos')).toBeTruthy();
  });

  it('shows the not-found page for a missing book', async () => {
    getBookDetails.mockRejectedValue(
      new ApiError('Livro não encontrado.', 404),
    );

    render(
      <MemoryRouter initialEntries={[`/livros/${book.id}`]}>
        <Routes>
          <Route path="/livros/:id" element={<BookDetailsPage />} />
        </Routes>
      </MemoryRouter>,
    );

    expect(
      await screen.findByText(
        'O livro pode ter sido removido do acervo ou o endereço está incorreto.',
      ),
    ).toBeTruthy();
  });
});
