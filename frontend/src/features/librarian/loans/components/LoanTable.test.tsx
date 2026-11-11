import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { LoanTable } from './LoanTable';

describe('LoanTable', () => {
  it('renders loan details and requests a different page', () => {
    const onPageChange = vi.fn();
    render(
      <LoanTable
        loans={[
          {
            id: 1,
            title: 'Clean Code',
            accessionNumber: 'T-001',
            readerName: 'Ana Silva',
            loanDate: '01/11/2026',
            dueDate: '08/11/2026',
            status: 'ON_TIME',
          },
        ]}
        page={1}
        totalItems={11}
        totalPages={2}
        returningLoanId={null}
        onPageChange={onPageChange}
        onReturn={vi.fn()}
      />,
    );

    expect(screen.getByText('Clean Code')).toBeTruthy();
    expect(screen.getByText('T-001')).toBeTruthy();
    expect(screen.getByText('Ana Silva')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: '2' }));
    expect(onPageChange).toHaveBeenCalledWith(2);
  });
});
