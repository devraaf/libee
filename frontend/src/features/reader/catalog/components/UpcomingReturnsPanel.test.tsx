import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';

const { listUpcomingReturns } = vi.hoisted(() => ({
  listUpcomingReturns: vi.fn(),
}));

vi.mock('@/features/reader/services/reader-api.service', () => ({
  listUpcomingReturns,
}));

import { UpcomingReturnsPanel } from '@/features/reader/catalog/components/UpcomingReturnsPanel';

function renderPanel() {
  return render(
    <MemoryRouter>
      <UpcomingReturnsPanel />
    </MemoryRouter>,
  );
}

beforeEach(() => {
  vi.resetAllMocks();
});

afterEach(cleanup);

describe('UpcomingReturnsPanel API states', () => {
  it('shows an accessible loading state', () => {
    listUpcomingReturns.mockReturnValue(new Promise(() => {}));

    renderPanel();

    expect(
      screen.getByRole('status', { name: 'Carregando próximas devoluções' }),
    ).toBeTruthy();
  });

  it('shows the empty state when there are no upcoming returns', async () => {
    listUpcomingReturns.mockResolvedValue([]);

    renderPanel();

    expect(await screen.findByText('Nenhuma devolução próxima')).toBeTruthy();
  });

  it('shows API errors and lets the reader retry', async () => {
    listUpcomingReturns
      .mockRejectedValueOnce(new Error('Falha ao carregar devoluções'))
      .mockResolvedValueOnce([]);

    renderPanel();

    expect(
      await screen.findByText('Falha ao carregar devoluções'),
    ).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Tentar novamente' }));

    expect(await screen.findByText('Nenhuma devolução próxima')).toBeTruthy();
    expect(listUpcomingReturns).toHaveBeenCalledTimes(2);
  });
});
