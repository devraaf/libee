import type { LoanStatus } from '../schemas/enums.schema';

export function dateFromToday(dayOffset: number): string {
  const date = new Date();
  date.setHours(12, 0, 0, 0);
  date.setDate(date.getDate() + dayOffset);
  return date.toISOString().slice(0, 10);
}

export function calculateLoanStatus(
  dueDate: string,
  returnDate: string | null,
  today = new Date(),
): LoanStatus {
  if (returnDate) return 'RETURNED';

  const todayDate = new Date(today);
  todayDate.setHours(0, 0, 0, 0);
  const due = new Date(`${dueDate}T00:00:00`);
  return todayDate > due ? 'OVERDUE' : 'ON_TIME';
}

export function addDays(date: string, days: number): string {
  const result = new Date(`${date}T12:00:00`);
  result.setDate(result.getDate() + days);
  return result.toISOString().slice(0, 10);
}
