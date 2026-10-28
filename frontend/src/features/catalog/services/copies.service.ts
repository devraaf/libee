import {
  mockBooks,
  mockCopies,
  mockDeletedBookIds,
  mockLoans,
} from '../../../shared/mocks/data';
import {
  MockServiceError,
  simulateServiceDelay,
} from '../../../shared/mocks/service-utils';
import type { Copy, CopyStatus } from '../../../shared/types/library';

export interface CreateCopyInput {
  bookId: number;
  accessionNumber: string;
  physicalLocation?: string | null;
}

export async function createCopy(input: CreateCopyInput): Promise<Copy> {
  await simulateServiceDelay();
  if (
    !mockBooks.some(({ id }) => id === input.bookId) ||
    mockDeletedBookIds.has(input.bookId)
  ) {
    throw new MockServiceError('Livro não encontrado.', 'NOT_FOUND');
  }
  const accessionNumber = input.accessionNumber.trim();
  if (
    !accessionNumber ||
    mockCopies.some((copy) => copy.accessionNumber === accessionNumber)
  ) {
    throw new MockServiceError(
      'Informe um tombo único e válido.',
      'VALIDATION_ERROR',
    );
  }
  const physicalLocation = input.physicalLocation?.trim() || null;

  const copy: Copy = {
    id: Math.max(0, ...mockCopies.map(({ id }) => id)) + 1,
    bookId: input.bookId,
    accessionNumber,
    physicalLocation,
    status: 'AVAILABLE',
  };
  mockCopies.push(copy);
  return { ...copy };
}

export async function updateCopyStatus(
  copyId: number,
  status: CopyStatus,
): Promise<Copy> {
  await simulateServiceDelay();
  const copy = mockCopies.find(({ id }) => id === copyId);
  if (!copy)
    throw new MockServiceError('Exemplar não encontrado.', 'NOT_FOUND');
  if (
    status === 'AVAILABLE' &&
    mockLoans.some(
      ({ copyId: loanCopyId, returnDate }) =>
        loanCopyId === copyId && !returnDate,
    )
  ) {
    throw new MockServiceError(
      'Devolva o empréstimo antes de liberar o exemplar.',
      'CONFLICT',
    );
  }
  copy.status = status;
  return { ...copy };
}

export async function deleteCopy(copyId: number): Promise<void> {
  await simulateServiceDelay();
  const index = mockCopies.findIndex(({ id }) => id === copyId);
  if (index < 0)
    throw new MockServiceError('Exemplar não encontrado.', 'NOT_FOUND');
  if (mockLoans.some(({ copyId: loanCopyId }) => loanCopyId === copyId)) {
    throw new MockServiceError(
      'Não é possível excluir um exemplar vinculado a empréstimos.',
      'CONFLICT',
    );
  }
  mockCopies.splice(index, 1);
}
