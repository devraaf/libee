import { describe, expect, it } from 'vitest';
import { addDays, calculateLoanStatus } from './date';

describe('shared date utilities', () => {
  it('calculates loan status against today without treating the due date as overdue', () => {
    const today = new Date(2026, 10, 11, 12);

    expect(calculateLoanStatus('2026-11-10', null, today)).toBe('OVERDUE');
    expect(calculateLoanStatus('2026-11-11', null, today)).toBe('ON_TIME');
    expect(calculateLoanStatus('2026-11-01', '2026-11-10', today)).toBe(
      'RETURNED',
    );
  });

  it('adds days across month and year boundaries', () => {
    expect(addDays('2026-10-31', 1)).toBe('2026-11-01');
    expect(addDays('2026-12-31', 1)).toBe('2027-01-01');
  });
});
