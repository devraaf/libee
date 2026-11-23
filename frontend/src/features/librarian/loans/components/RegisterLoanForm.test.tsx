import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const { searchReadersForLoan, registerReader, listCourses } = vi.hoisted(
  () => ({
    searchReadersForLoan: vi.fn(),
    registerReader: vi.fn(),
    listCourses: vi.fn(),
  }),
);

vi.mock('../../readers/services/readers.service', () => ({
  searchReadersForLoan,
}));
vi.mock('@/features/auth/services/auth.service', () => ({
  register: registerReader,
}));
vi.mock('@/features/courses/services/course.service', () => ({
  listCourses,
}));

import RegisterLoanForm from './RegisterLoanForm';

describe('RegisterLoanForm', () => {
  afterEach(() => cleanup());

  beforeEach(() => {
    vi.resetAllMocks();
    listCourses.mockResolvedValue([]);
  });

  it('searches and selects a reader before submitting the loan details', async () => {
    searchReadersForLoan.mockResolvedValue([
      {
        id: 21,
        name: 'Ana Silva',
        email: 'ana@example.com',
        status: 'REGULAR',
      },
    ]);
    const onConfirm = vi.fn().mockResolvedValue(undefined);

    render(<RegisterLoanForm onCancel={vi.fn()} onConfirm={onConfirm} />);

    fireEvent.change(
      screen.getByPlaceholderText('Digite o nome ou e-mail do leitor'),
      {
        target: { value: 'Ana' },
      },
    );
    await screen.findByText('ana@example.com');

    expect(searchReadersForLoan).toHaveBeenCalledWith('Ana');
    fireEvent.click(screen.getByRole('button', { name: /Ana Silva/ }));
    fireEvent.change(screen.getByLabelText('Tombo do exemplar'), {
      target: { value: 'T-021' },
    });

    const dueDate = screen.getByLabelText(
      'Devolução prevista',
    ) as HTMLInputElement;
    expect(dueDate.value).not.toBe('');
    fireEvent.click(screen.getByRole('button', { name: 'Confirmar' }));

    await waitFor(() => {
      expect(onConfirm).toHaveBeenCalledWith({
        readerId: 21,
        accessionNumber: 'T-021',
        dueDate: dueDate.value,
      });
    });
    expect(onConfirm.mock.calls[0][0]).not.toHaveProperty('librarianId');
  });

  it('warns when selecting a reader with pending overdue loans and allows submission', async () => {
    searchReadersForLoan.mockResolvedValue([
      {
        id: 22,
        name: 'Bruno Silva',
        email: 'bruno@example.com',
        status: 'PENDING',
      },
    ]);

    const onConfirm = vi.fn().mockResolvedValue(undefined);
    render(<RegisterLoanForm onCancel={vi.fn()} onConfirm={onConfirm} />);
    fireEvent.change(
      screen.getByPlaceholderText('Digite o nome ou e-mail do leitor'),
      {
        target: { value: 'Bruno' },
      },
    );

    fireEvent.click(
      await screen.findByRole('button', {
        name: /Bruno Silva/,
      }),
    );
    expect(screen.getByRole('alert').textContent).toContain(
      'este leitor possui empréstimo em atraso',
    );
    fireEvent.change(screen.getByLabelText('Tombo do exemplar'), {
      target: { value: 'T-022' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Confirmar' }));

    await waitFor(() => {
      expect(onConfirm).toHaveBeenCalledWith(
        expect.objectContaining({
          readerId: 22,
          accessionNumber: 'T-022',
        }),
      );
    });
  });

  it('clears the reader search using the styled clear button', async () => {
    searchReadersForLoan.mockResolvedValue([
      {
        id: 21,
        name: 'Ana Silva',
        email: 'ana@example.com',
        status: 'REGULAR',
      },
    ]);

    render(<RegisterLoanForm onCancel={vi.fn()} onConfirm={vi.fn()} />);
    const readerInput = screen.getByPlaceholderText(
      'Digite o nome ou e-mail do leitor',
    ) as HTMLInputElement;
    fireEvent.change(readerInput, { target: { value: 'Ana' } });
    fireEvent.click(await screen.findByRole('button', { name: /Ana Silva/ }));

    fireEvent.click(screen.getByRole('button', { name: 'Limpar leitor' }));

    expect(readerInput.value).toBe('');
    expect(screen.queryByText('ana@example.com')).toBeNull();
  });

  it('registers a missing reader, selects it, and preserves loan fields', async () => {
    searchReadersForLoan.mockResolvedValue([]);
    registerReader.mockResolvedValue({
      id: 45,
      name: 'Carla Lima',
      email: 'carla@example.com',
      profile: 'READER',
    });
    const onConfirm = vi.fn().mockResolvedValue(undefined);

    render(<RegisterLoanForm onCancel={vi.fn()} onConfirm={onConfirm} />);
    fireEvent.change(
      screen.getByPlaceholderText('Digite o nome ou e-mail do leitor'),
      {
        target: { value: 'carla@example.com' },
      },
    );

    fireEvent.change(screen.getByLabelText('Tombo do exemplar'), {
      target: { value: 'T-045' },
    });
    const dueDate = screen.getByLabelText(
      'Devolução prevista',
    ) as HTMLInputElement;
    const originalDueDate = dueDate.value;
    fireEvent.click(
      await screen.findByRole('button', {
        name: 'Leitor não encontrado? Cadastrar leitor',
      }),
    );

    const registrationDialog = await screen.findByRole('dialog', {
      name: 'Cadastrar leitor',
    });
    expect(within(registrationDialog).getByLabelText('E-mail')).toHaveProperty(
      'value',
      'carla@example.com',
    );
    fireEvent.change(screen.getByLabelText('Nome completo'), {
      target: { value: 'Carla Lima' },
    });
    fireEvent.click(screen.getByLabelText('Funcionário'));
    fireEvent.change(screen.getByLabelText('Senha'), {
      target: { value: 'SenhaInicial1' },
    });
    fireEvent.change(screen.getByLabelText('Confirmar Senha'), {
      target: { value: 'SenhaInicial1' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Cadastrar leitor' }));

    expect(await screen.findByText('Carla Lima')).toBeTruthy();
    expect(
      screen.getByText('Leitor "Carla Lima" cadastrado e selecionado.'),
    ).toBeTruthy();
    expect(screen.getByLabelText('Tombo do exemplar')).toHaveProperty(
      'value',
      'T-045',
    );
    expect(dueDate.value).toBe(originalDueDate);

    fireEvent.click(screen.getByRole('button', { name: 'Confirmar' }));
    await waitFor(() => {
      expect(onConfirm).toHaveBeenCalledWith({
        readerId: 45,
        accessionNumber: 'T-045',
        dueDate: originalDueDate,
      });
    });
  });
});
