import {
  act,
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
import { ApiError } from '@/shared/api/api-error';
import type { ReaderLoan } from '@/features/reader/reader-loans/utils/readerLoans';

const { listMyLoans, renewMyLoan } = vi.hoisted(() => ({
  listMyLoans: vi.fn(),
  renewMyLoan: vi.fn(),
}));

vi.mock('@/features/reader/services/reader-api.service', () => ({
  listMyLoans,
  renewMyLoan,
}));

import ReaderLoansPage from '@/features/reader/reader-loans/pages/ReaderLoansPage';

const loan: ReaderLoan = {
  id: 1,
  bookId: 11,
  title: 'Clean Code',
  author: 'Robert C. Martin',
  coverUrl: null,
  year: null,
  tombo: 'T-001',
  loanDate: '2026-11-01',
  dueDate: '2026-11-20',
  returnDate: null,
  renewalCount: 0,
  status: 'on_time',
};

function page(content: ReaderLoan[], currentPage = 1, totalPages = 0) {
  return {
    content,
    page: currentPage,
    size: 10,
    totalElements: totalPages * 10,
    totalPages,
  } satisfies PageResponse<ReaderLoan>;
}

function renderLoans() {
  return render(
    <MemoryRouter>
      <ReaderLoansPage />
    </MemoryRouter>,
  );
}

beforeEach(() => {
  vi.resetAllMocks();
});

afterEach(cleanup);

describe('ReaderLoansPage API states', () => {
  it('shows empty states for active and returned loans', async () => {
    listMyLoans.mockResolvedValue(page([]));

    renderLoans();

    expect(
      await screen.findByText('Você não possui empréstimos ativos'),
    ).toBeTruthy();
    expect(
      screen.getByText('Ainda não existem empréstimos devolvidos'),
    ).toBeTruthy();
  });

  it('uses the shared loan card for active loans and history', async () => {
    const returnedLoan: ReaderLoan = {
      ...loan,
      id: 2,
      title: 'Clean Architecture',
      status: 'returned',
      returnDate: '2026-11-08',
    };
    listMyLoans.mockImplementation(({ statuses }: { statuses: string[] }) =>
      Promise.resolve(
        statuses.includes('RETURNED')
          ? page([returnedLoan], 1, 1)
          : page([loan], 1, 1),
      ),
    );

    renderLoans();

    expect(await screen.findByText('Clean Code')).toBeTruthy();
    const activeLoans = screen.getByRole('region', {
      name: 'Empréstimos ativos',
    });
    expect(within(activeLoans).getByText('Renovações')).toBeTruthy();
    expect(
      within(activeLoans).getByRole('button', {
        name: 'Renovar empréstimo de Clean Code',
      }),
    ).toBeTruthy();
    expect(await screen.findByText('Clean Architecture')).toBeTruthy();
    const history = screen.getByRole('region', { name: 'Histórico' });
    expect(within(history).getByText('Devolvido em')).toBeTruthy();
    expect(within(history).queryByText('Renovações')).toBeNull();
    expect(
      within(history).queryByRole('button', {
        name: 'Renovar empréstimo de Clean Architecture',
      }),
    ).toBeNull();
  });

  it('shows the API error and retry action', async () => {
    listMyLoans.mockRejectedValue(new Error('Falha ao carregar empréstimos'));

    renderLoans();

    expect(
      await screen.findByText('Falha ao carregar empréstimos'),
    ).toBeTruthy();
    expect(
      screen.getByRole('button', { name: 'Tentar novamente' }),
    ).toBeTruthy();
  });

  it('does not repeat loan loading when retry is clicked multiple times', async () => {
    listMyLoans.mockImplementation(() =>
      listMyLoans.mock.calls.length <= 2
        ? Promise.reject(new Error('Falha ao carregar empréstimos'))
        : Promise.resolve(page([])),
    );

    renderLoans();
    const retryButton = await screen.findByRole('button', {
      name: 'Tentar novamente',
    });

    act(() => {
      fireEvent.click(retryButton);
      fireEvent.click(retryButton);
    });

    expect(
      await screen.findByText('Você não possui empréstimos ativos'),
    ).toBeTruthy();
    expect(listMyLoans).toHaveBeenCalledTimes(4);
  });

  it('requests separate status pages and paginates active loans', async () => {
    listMyLoans.mockImplementation(
      ({
        statuses,
        page: requestedPage,
      }: {
        statuses: string[];
        page: number;
      }) =>
        Promise.resolve(
          statuses.includes('RETURNED')
            ? page([])
            : requestedPage === 1
              ? page([loan], 1, 2)
              : page([{ ...loan, id: 2, title: 'Clean Architecture' }], 2, 2),
        ),
    );

    renderLoans();

    expect(await screen.findByText('Clean Code')).toBeTruthy();
    const activeLoans = screen.getByRole('region', {
      name: 'Empréstimos ativos',
    });
    fireEvent.click(within(activeLoans).getByRole('button', { name: '2' }));

    expect(await screen.findByText('Clean Architecture')).toBeTruthy();
    await waitFor(() => {
      expect(listMyLoans).toHaveBeenCalledWith(
        expect.objectContaining({
          statuses: ['ON_TIME', 'OVERDUE'],
          page: 2,
          size: 10,
        }),
      );
      expect(listMyLoans).toHaveBeenCalledWith(
        expect.objectContaining({ statuses: ['RETURNED'] }),
      );
    });
  });

  it('shows the API message when renewal is rejected', async () => {
    listMyLoans.mockImplementation(({ statuses }: { statuses: string[] }) =>
      Promise.resolve(
        statuses.includes('RETURNED')
          ? page([])
          : page(
              [
                {
                  ...loan,
                  status: 'overdue',
                  title: 'Atrasado',
                  dueDate: '2026-10-10',
                },
              ],
              1,
              1,
            ),
      ),
    );
    renewMyLoan.mockRejectedValue(
      new ApiError('O empréstimo está atrasado e não pode ser renovado.', 409),
    );

    renderLoans();
    fireEvent.click(
      await screen.findByRole('button', {
        name: 'Renovar empréstimo de Atrasado',
      }),
    );

    expect(await screen.findByRole('alert')).toHaveProperty(
      'textContent',
      'O empréstimo está atrasado e não pode ser renovado.',
    );
  });

  it('does not send repeated renewal requests while one is in flight', async () => {
    listMyLoans.mockImplementation(({ statuses }: { statuses: string[] }) =>
      Promise.resolve(
        statuses.includes('RETURNED') ? page([]) : page([loan], 1, 1),
      ),
    );
    let resolveRenewal: (updatedLoan: ReaderLoan) => void = () => {};
    renewMyLoan.mockImplementation(
      () =>
        new Promise<ReaderLoan>((resolve) => {
          resolveRenewal = resolve;
        }),
    );

    renderLoans();
    const renewButton = await screen.findByRole('button', {
      name: 'Renovar empréstimo de Clean Code',
    });

    act(() => {
      fireEvent.click(renewButton);
      fireEvent.click(renewButton);
    });

    expect(renewMyLoan).toHaveBeenCalledTimes(1);
    expect(renewButton).toHaveProperty('disabled', true);

    await act(async () => {
      resolveRenewal({ ...loan, renewalCount: 1 });
    });
    expect(
      await screen.findByText('Empréstimo renovado com sucesso.'),
    ).toBeTruthy();
  });
});
