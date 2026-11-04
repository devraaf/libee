import {
  mockCourses,
  mockLoans,
  mockReaders,
  mockUsers,
} from '../../../../shared/mocks/data';
import {
  MockServiceError,
  simulateSearchError,
  simulateServiceDelay,
} from '../../../../shared/mocks/service-utils';
import type {
  CreateReaderInput,
  Reader,
} from '../../../../shared/types/library';

export async function listReaders(search = ''): Promise<Reader[]> {
  await simulateServiceDelay();
  simulateSearchError(search);
  const query = search.trim().toLocaleLowerCase();
  return mockReaders
    .filter(
      (reader) =>
        !query ||
        reader.name.toLocaleLowerCase().includes(query) ||
        reader.email.toLocaleLowerCase().includes(query),
    )
    .map((reader) => ({ ...reader }));
}

export async function getReader(readerId: number): Promise<Reader> {
  await simulateServiceDelay();
  const reader = mockReaders.find(({ id }) => id === readerId);
  if (!reader)
    throw new MockServiceError('Leitor não encontrado.', 'NOT_FOUND');
  return { ...reader };
}

export async function createReader(input: CreateReaderInput): Promise<Reader> {
  await simulateServiceDelay();
  const email = input.email.trim().toLowerCase();
  if (mockUsers.some((user) => user.email.toLowerCase() === email)) {
    throw new MockServiceError('Este e-mail já está cadastrado.', 'CONFLICT');
  }
  if (
    input.affiliationType === 'STUDENT' &&
    !mockCourses.some(({ id }) => id === input.courseId)
  ) {
    throw new MockServiceError(
      'Selecione um curso válido.',
      'VALIDATION_ERROR',
    );
  }

  const reader: Reader = {
    ...input,
    id: Math.max(0, ...mockUsers.map(({ id }) => id)) + 1,
    email,
    password: '',
    profile: 'READER',
  };
  mockUsers.push(reader);
  mockReaders.push(reader);
  return { ...reader };
}

export async function deleteReader(readerId: number): Promise<void> {
  await simulateServiceDelay();
  const readerIndex = mockReaders.findIndex(({ id }) => id === readerId);
  if (readerIndex < 0)
    throw new MockServiceError('Leitor não encontrado.', 'NOT_FOUND');
  if (mockLoans.some(({ readerId: id }) => id === readerId)) {
    throw new MockServiceError(
      'Não é possível excluir um leitor vinculado a empréstimos.',
      'CONFLICT',
    );
  }
  mockReaders.splice(readerIndex, 1);
  const userIndex = mockUsers.findIndex(({ id }) => id === readerId);
  if (userIndex >= 0) mockUsers.splice(userIndex, 1);
}
