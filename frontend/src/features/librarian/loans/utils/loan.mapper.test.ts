import { describe, expect, it } from 'vitest';
import { mapActiveLoan, mapReturnedLoan } from './loan.mapper';

describe('loan DTO adapters', () => {
  it('maps an active-loan DTO to the management table model', () => {
    expect(
      mapActiveLoan({
        id: 17,
        readerName: 'Ana Silva',
        title: 'Clean Code',
        accessionNumber: 'T-017',
        loanDate: '2026-11-01',
        dueDate: '2026-11-08',
        renewalCount: 0,
        status: 'ON_TIME',
      }),
    ).toEqual({
      id: 17,
      readerName: 'Ana Silva',
      title: 'Clean Code',
      accessionNumber: 'T-017',
      loanDate: '01/11/2026',
      dueDate: '08/11/2026',
      status: 'ON_TIME',
    });
  });

  it('maps a returned-loan DTO to the returns table model', () => {
    expect(
      mapReturnedLoan({
        id: 18,
        readerName: 'João Lima',
        title: 'Domain-Driven Design',
        accessionNumber: 'T-018',
        returnDate: '2026-11-09',
      }),
    ).toEqual({
      id: 18,
      reader: 'João Lima',
      title: 'Domain-Driven Design',
      copyCode: 'T-018',
      returnDate: '09/11/2026',
    });
  });
});
