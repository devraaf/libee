import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ApiError } from '@/shared/api/api-error';

const { lookupBookByIsbn, registerManagedBook } = vi.hoisted(() => ({
  lookupBookByIsbn: vi.fn(),
  registerManagedBook: vi.fn(),
}));

vi.mock('../services/book-management.service', () => ({
  lookupBookByIsbn,
  registerManagedBook,
}));

import RegisterBookModal from './RegisterBookModal';

async function fillRequiredBookFields() {
  fireEvent.change(screen.getByPlaceholderText('ex: 9786500000001'), {
    target: { value: '9786500000001' },
  });
  fireEvent.click(
    screen.getByRole('button', { name: 'Preencher manualmente' }),
  );

  fireEvent.change(await screen.findByPlaceholderText('Título da obra'), {
    target: { value: 'Livro de teste' },
  });
  fireEvent.change(screen.getByRole('combobox'), {
    target: { value: '3' },
  });
  fireEvent.click(screen.getByRole('button', { name: 'Continuar' }));

  fireEvent.change(await screen.findByPlaceholderText('ex: 0090'), {
    target: { value: 'T-090' },
  });
  fireEvent.change(screen.getByPlaceholderText('ex: Estante A-01'), {
    target: { value: 'A-01' },
  });
}

describe('RegisterBookModal API errors', () => {
  afterEach(() => cleanup());

  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('associates backend 400 field errors with the matching form fields', async () => {
    registerManagedBook.mockRejectedValue(
      new ApiError('Um ou mais campos são inválidos.', 400, undefined, {
        errors: [
          {
            field: 'copies[0].physicalLocation',
            message: 'A localização informada é inválida.',
          },
        ],
      }),
    );

    render(
      <RegisterBookModal
        open
        onClose={vi.fn()}
        onSuccess={vi.fn()}
        categories={[{ id: 3, name: 'Tecnologia' }]}
        categoriesLoading={false}
        categoriesError={null}
        onRetryCategories={vi.fn()}
        onCategoryCreated={vi.fn()}
      />,
    );
    expect(
      screen.getByRole('list', { name: 'Etapas do cadastro' }),
    ).toBeTruthy();
    await fillRequiredBookFields();
    fireEvent.click(screen.getByRole('button', { name: 'Salvar livro' }));

    expect(
      await screen.findByText('A localização informada é inválida.'),
    ).toBeTruthy();
  });

  it('shows conflicting accession numbers on the corresponding copy field', async () => {
    registerManagedBook.mockRejectedValue(
      new ApiError('Tombo já cadastrado.', 409, undefined, {
        accessionNumbers: ['T-090'],
      }),
    );

    render(
      <RegisterBookModal
        open
        onClose={vi.fn()}
        onSuccess={vi.fn()}
        categories={[{ id: 3, name: 'Tecnologia' }]}
        categoriesLoading={false}
        categoriesError={null}
        onRetryCategories={vi.fn()}
        onCategoryCreated={vi.fn()}
      />,
    );
    await fillRequiredBookFields();
    fireEvent.click(screen.getByRole('button', { name: 'Salvar livro' }));

    expect(
      await screen.findByText('Este tombo já está cadastrado.'),
    ).toBeTruthy();
    await waitFor(() => {
      expect(screen.getByText('Tombos em conflito: T-090')).toBeTruthy();
    });
  });
});
