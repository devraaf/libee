import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const { getReaderManagementSummary, listManagementReaders } = vi.hoisted(
  () => ({
    getReaderManagementSummary: vi.fn(),
    listManagementReaders: vi.fn(),
  }),
);

vi.mock('../services/readers.service', () => ({
  getReaderManagementSummary,
  listManagementReaders,
}));

vi.mock('../components/RegisterReaderModal', () => ({
  default: ({
    open,
    onSuccess,
  }: {
    open: boolean;
    onSuccess: (reader: {
      id: number;
      name: string;
      email: string;
      profile: 'READER';
    }) => void;
  }) =>
    open ? (
      <div role="dialog" aria-label="Cadastro de leitor">
        <button
          type="button"
          onClick={() =>
            onSuccess({
              id: 45,
              name: 'Carla Lima',
              email: 'carla@example.com',
              profile: 'READER',
            })
          }
        >
          Simular cadastro concluído
        </button>
      </div>
    ) : null,
}));

import ReadersPage from './ReadersPage';

describe('ReadersPage', () => {
  afterEach(() => cleanup());

  beforeEach(() => {
    vi.resetAllMocks();
    getReaderManagementSummary.mockResolvedValue({
      totalReaders: 1,
      readersWithActiveLoans: 0,
      readersWithOverdueLoans: 0,
    });
    listManagementReaders.mockResolvedValue({
      content: [
        {
          id: 45,
          name: 'Carla Lima',
          email: 'carla@example.com',
          phone: null,
          affiliationType: 'EMPLOYEE',
          courseName: null,
          activeLoans: 0,
          status: 'REGULAR',
        },
      ],
      page: 0,
      size: 10,
      totalElements: 1,
      totalPages: 1,
    });
  });

  it('opens the registration modal and refreshes the reader list after success', async () => {
    render(<ReadersPage />);

    expect(await screen.findByText('Carla Lima')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Cadastrar leitor' }));
    fireEvent.click(
      screen.getByRole('button', { name: 'Simular cadastro concluído' }),
    );

    expect(
      await screen.findByText('Leitor "Carla Lima" cadastrado com sucesso.'),
    ).toBeTruthy();
    await waitFor(() => {
      expect(listManagementReaders).toHaveBeenCalledTimes(2);
      expect(getReaderManagementSummary).toHaveBeenCalledTimes(2);
    });
    expect(await screen.findByText('Carla Lima')).toBeTruthy();
  });
});
