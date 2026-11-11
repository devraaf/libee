import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const { listReturnedLoans, returnLoan } = vi.hoisted(() => ({
  listReturnedLoans: vi.fn(),
  returnLoan: vi.fn(),
}));

vi.mock('../../loans/services/loans.service', () => ({
  listReturnedLoans,
  returnLoan,
}));

import ReturnsPage from './ReturnsPage';

describe('ReturnsPage', () => {
  afterEach(() => cleanup());

  beforeEach(() => {
    vi.resetAllMocks();
    listReturnedLoans.mockResolvedValue({
      content: [
        {
          id: 33,
          readerName: 'Ana Silva',
          title: 'Clean Code',
          accessionNumber: 'T-033',
          returnDate: '2026-11-09',
        },
      ],
      page: 1,
      size: 10,
      totalElements: 1,
      totalPages: 1,
    });
  });

  it('renders the server list and searches by reader, title, or tombo', async () => {
    render(<ReturnsPage />);

    expect(await screen.findByText('Clean Code')).toBeTruthy();
    expect(screen.getByText('T-033')).toBeTruthy();
    expect(screen.getByText('Ana Silva')).toBeTruthy();

    fireEvent.change(
      screen.getByPlaceholderText('Pesquise por leitor, livro ou tombo...'),
      { target: { value: 'Ana' } },
    );

    await waitFor(() => {
      expect(listReturnedLoans).toHaveBeenLastCalledWith({
        page: 1,
        size: 10,
        search: 'Ana',
      });
    });
  });

  it('opens the return modal from the page action and records the accession number', async () => {
    returnLoan.mockResolvedValue(undefined);
    render(<ReturnsPage />);

    expect(screen.queryByLabelText('Tombo do exemplar')).toBeNull();
    fireEvent.click(
      screen.getByRole('button', { name: 'Registrar devolução' }),
    );

    const accessionInput = await screen.findByLabelText('Tombo do exemplar');
    fireEvent.change(accessionInput, { target: { value: 'T-099' } });
    fireEvent.click(screen.getByRole('button', { name: 'Confirmar' }));

    await waitFor(() => {
      expect(returnLoan).toHaveBeenCalledWith('T-099');
    });
    expect(
      await screen.findByText(
        'Devolução do tombo T-099 registrada com sucesso.',
      ),
    ).toBeTruthy();
  });
});
