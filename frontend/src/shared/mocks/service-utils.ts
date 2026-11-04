export type MockServiceErrorCode =
  | 'SIMULATED_ERROR'
  | 'NOT_FOUND'
  | 'ISBN_ALREADY_REGISTERED'
  | 'SERVICE_UNAVAILABLE'
  | 'VALIDATION_ERROR'
  | 'CONFLICT';

export class MockServiceError extends Error {
  public readonly code: MockServiceErrorCode;

  constructor(message: string, code: MockServiceErrorCode) {
    super(message);
    this.name = 'MockServiceError';
    this.code = code;
  }
}

export async function simulateServiceDelay(): Promise<void> {
  const delay = 300 + Math.floor(Math.random() * 301);
  await new Promise<void>((resolve) => setTimeout(resolve, delay));
}

export function simulateSearchError(search?: string): void {
  if (
    search?.trim().toLowerCase() === 'simular erro' ||
    search === '__error__'
  ) {
    throw new MockServiceError(
      'Erro simulado para validar o estado de falha.',
      'SIMULATED_ERROR',
    );
  }
}
