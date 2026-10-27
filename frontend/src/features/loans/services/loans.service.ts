import {
  mockCopies,
  mockLoans,
  mockReaders,
  mockUsers,
} from '../../../shared/mocks/data';
import {
  addDays,
  calculateLoanStatus,
  dateFromToday,
} from '../../../shared/mocks/dates';
import {
  MockServiceError,
  simulateSearchError,
  simulateServiceDelay,
} from '../../../shared/mocks/service-utils';
import type { CreateLoanInput, Loan } from '../../../shared/types/library';

function withCurrentStatus(loan: Omit<Loan, 'status'> | Loan): Loan {
  return {
    ...loan,
    status: calculateLoanStatus(loan.dueDate, loan.returnDate),
  };
}

export async function listLoans(search = ''): Promise<Loan[]> {
  await simulateServiceDelay();
  simulateSearchError(search);
  const query = search.trim().toLocaleLowerCase();
  return mockLoans
    .filter(
      (loan) =>
        !query ||
        String(loan.id).includes(query) ||
        String(loan.readerId).includes(query) ||
        String(loan.copyId).includes(query),
    )
    .map(withCurrentStatus);
}

export async function getLoan(loanId: number): Promise<Loan> {
  await simulateServiceDelay();
  const loan = mockLoans.find(({ id }) => id === loanId);
  if (!loan)
    throw new MockServiceError('Empréstimo não encontrado.', 'NOT_FOUND');
  return withCurrentStatus(loan);
}

export async function createLoan(input: CreateLoanInput): Promise<Loan> {
  await simulateServiceDelay();
  const copy = mockCopies.find(({ id }) => id === input.copyId);
  if (!copy)
    throw new MockServiceError('Exemplar não encontrado.', 'NOT_FOUND');
  if (copy.status !== 'AVAILABLE') {
    throw new MockServiceError(
      'Este exemplar não está disponível.',
      'CONFLICT',
    );
  }
  if (!mockReaders.some(({ id }) => id === input.readerId)) {
    throw new MockServiceError('Leitor não encontrado.', 'VALIDATION_ERROR');
  }
  if (
    !mockUsers.some(
      ({ id, profile }) => id === input.librarianId && profile === 'LIBRARIAN',
    )
  ) {
    throw new MockServiceError(
      'Bibliotecário não encontrado.',
      'VALIDATION_ERROR',
    );
  }
  if (
    !/^\d{4}-\d{2}-\d{2}$/.test(input.loanDate) ||
    !/^\d{4}-\d{2}-\d{2}$/.test(input.dueDate) ||
    input.dueDate < input.loanDate
  ) {
    throw new MockServiceError(
      'As datas do empréstimo são inválidas.',
      'VALIDATION_ERROR',
    );
  }

  const loan = {
    ...input,
    id: Math.max(0, ...mockLoans.map(({ id }) => id)) + 1,
    returnDate: null,
    renewalCount: 0,
  };
  mockLoans.push(loan);
  copy.status = 'ON_LOAN';
  return withCurrentStatus(loan);
}

export async function returnLoan(loanId: number): Promise<Loan> {
  await simulateServiceDelay();
  const loan = mockLoans.find(({ id }) => id === loanId);
  if (!loan)
    throw new MockServiceError('Empréstimo não encontrado.', 'NOT_FOUND');
  if (loan.returnDate) {
    throw new MockServiceError('Este empréstimo já foi devolvido.', 'CONFLICT');
  }

  loan.returnDate = dateFromToday(0);
  const copy = mockCopies.find(({ id }) => id === loan.copyId);
  if (copy) copy.status = 'AVAILABLE';
  return withCurrentStatus(loan);
}

export async function renewLoan(loanId: number): Promise<Loan> {
  await simulateServiceDelay();
  const loan = mockLoans.find(({ id }) => id === loanId);
  if (!loan)
    throw new MockServiceError('Empréstimo não encontrado.', 'NOT_FOUND');
  if (loan.returnDate) {
    throw new MockServiceError(
      'Não é possível renovar um empréstimo devolvido.',
      'CONFLICT',
    );
  }
  if (loan.renewalCount >= 2) {
    throw new MockServiceError(
      'O limite de renovações foi atingido.',
      'CONFLICT',
    );
  }

  loan.dueDate = addDays(loan.dueDate, 14);
  loan.renewalCount += 1;
  return withCurrentStatus(loan);
}
