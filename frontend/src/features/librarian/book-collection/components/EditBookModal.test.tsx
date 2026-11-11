import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const { getBookDetails, deleteManagedCopy } = vi.hoisted(() => ({
  getBookDetails: vi.fn(),
  deleteManagedCopy: vi.fn(),
}));

vi.mock('@/features/book-details/services/books.service', () => ({
  getBookDetails,
}));

vi.mock('../services/book-management.service', () => ({
  deleteManagedCopy,
}));

import EditBookModal from './EditBookModal';

describe('EditBookModal', () => {
  const categories = [
    { id: 2, name: 'Literatura' },
    { id: 3, name: 'Tecnologia' },
  ];

  afterEach(() => cleanup());

  beforeEach(() => {
    vi.resetAllMocks();
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
      copies: [
        {
          id: 24,
          bookId: 8,
          accessionNumber: 'T-024',
          physicalLocation: 'A-01',
          status: 'AVAILABLE',
        },
      ],
    });
    deleteManagedCopy.mockResolvedValue(undefined);
  });

  it('loads real details and confirms copy removal', async () => {
    const onCopyDeleted = vi.fn();
    render(
      <EditBookModal
        open
        bookId={8}
        categories={categories}
        onClose={vi.fn()}
        onCopyDeleted={onCopyDeleted}
      />,
    );

    expect(await screen.findByDisplayValue('Clean Code')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Continuar' }));
    fireEvent.click(screen.getByRole('button', { name: 'Excluir exemplar' }));
    fireEvent.click(screen.getByRole('button', { name: 'Confirmar exclusão' }));

    expect(deleteManagedCopy).toHaveBeenCalledWith(8, 24);
    await waitFor(() => expect(onCopyDeleted).toHaveBeenCalledOnce());
  });

  it('prevents deleting a copy with an active loan', async () => {
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
        available: false,
      },
      copies: [
        {
          id: 24,
          bookId: 8,
          accessionNumber: 'T-024',
          physicalLocation: 'A-01',
          status: 'ON_LOAN',
        },
      ],
    });

    render(
      <EditBookModal
        open
        bookId={8}
        categories={categories}
        onClose={vi.fn()}
        onCopyDeleted={vi.fn()}
      />,
    );

    expect(await screen.findByDisplayValue('Clean Code')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Continuar' }));
    expect(
      screen.getByRole('button', { name: 'Excluir exemplar' }),
    ).toHaveProperty('disabled', true);
    expect(deleteManagedCopy).not.toHaveBeenCalled();
  });

  it('allows editing all book fields and adding copy drafts without a warning', async () => {
    render(
      <EditBookModal
        open
        bookId={8}
        categories={categories}
        onClose={vi.fn()}
        onCopyDeleted={vi.fn()}
      />,
    );

    expect(await screen.findByDisplayValue('Clean Code')).toBeTruthy();
    expect(screen.queryByText(/a api ainda não permite/i)).toBeNull();

    const title = screen.getByRole('textbox', { name: 'Título' });
    fireEvent.change(title, { target: { value: 'Clean Code - edição nova' } });
    expect(title).toHaveProperty('value', 'Clean Code - edição nova');

    const isbn = screen.getByRole('textbox', { name: 'ISBN' });
    fireEvent.change(isbn, { target: { value: '9780132350885' } });
    expect(isbn).toHaveProperty('value', '9780132350885');

    const category = screen.getByRole('combobox', { name: 'Categoria' });
    fireEvent.change(category, { target: { value: '2' } });
    expect(category).toHaveProperty('value', '2');

    const publisher = screen.getByRole('textbox', { name: 'Editora' });
    fireEvent.change(publisher, { target: { value: 'Editora atualizada' } });
    expect(publisher).toHaveProperty('value', 'Editora atualizada');

    const publicationPlace = screen.getByRole('textbox', {
      name: 'Local de publicação',
    });
    fireEvent.change(publicationPlace, { target: { value: 'São Paulo' } });
    expect(publicationPlace).toHaveProperty('value', 'São Paulo');

    const edition = screen.getByRole('textbox', { name: 'Edição' });
    fireEvent.change(edition, { target: { value: '2ª' } });
    expect(edition).toHaveProperty('value', '2ª');

    const publicationYear = screen.getByRole('spinbutton', {
      name: 'Ano de publicação',
    });
    fireEvent.change(publicationYear, { target: { value: '2025' } });
    expect(publicationYear).toHaveProperty('value', '2025');

    const pageCount = screen.getByRole('spinbutton', {
      name: 'Número de páginas',
    });
    fireEvent.change(pageCount, { target: { value: '500' } });
    expect(pageCount).toHaveProperty('value', '500');

    const coverUrl = screen.getByRole('textbox', { name: 'Capa' });
    fireEvent.change(coverUrl, {
      target: { value: 'https://example.com/new-cover.jpg' },
    });
    expect(coverUrl).toHaveProperty(
      'value',
      'https://example.com/new-cover.jpg',
    );

    const newAuthorInput = screen.getByRole('textbox', {
      name: 'Nome do autor',
    });
    fireEvent.change(newAuthorInput, { target: { value: 'Jane Doe' } });
    fireEvent.click(screen.getByRole('button', { name: 'Adicionar' }));
    expect(screen.getByText('Jane Doe')).toBeTruthy();

    const summary = screen.getByRole('textbox', { name: 'Resumo' });
    fireEvent.change(summary, { target: { value: 'Resumo atualizado' } });
    expect(summary).toHaveProperty('value', 'Resumo atualizado');

    fireEvent.click(screen.getByRole('button', { name: 'Continuar' }));
    const accessionNumber = screen.getByRole('textbox', {
      name: 'Tombo do exemplar 1',
    });
    fireEvent.change(accessionNumber, { target: { value: 'T-024-EDIT' } });
    expect(accessionNumber).toHaveProperty('value', 'T-024-EDIT');
    const location = screen.getByRole('textbox', {
      name: 'Localização física do exemplar 1',
    });
    fireEvent.change(location, { target: { value: 'B-05' } });
    expect(location).toHaveProperty('value', 'B-05');

    fireEvent.click(screen.getByRole('button', { name: 'Adicionar exemplar' }));
    expect(
      screen.getByRole('textbox', { name: 'Tombo do exemplar 2' }),
    ).toBeTruthy();
    expect(
      screen.getByRole('button', { name: 'Salvar alterações' }),
    ).toHaveProperty('disabled', true);
  });
});
