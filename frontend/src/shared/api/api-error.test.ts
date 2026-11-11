import { describe, expect, it } from 'vitest';
import { ApiError } from './api-error';

describe('ApiError', () => {
  it('keeps API validation fields and blocked accession numbers available', () => {
    const error = new ApiError('Dados inválidos.', 400, undefined, {
      errors: [
        {
          field: 'copies[0].physicalLocation',
          message: 'Informe a localização.',
        },
      ],
      accessionNumbers: ['T-001', 'T-002'],
      bookId: 7,
    });

    expect(error.errors).toEqual([
      {
        field: 'copies[0].physicalLocation',
        message: 'Informe a localização.',
      },
    ]);
    expect(error.accessionNumbers).toEqual(['T-001', 'T-002']);
    expect(error.bookId).toBe(7);
  });
});
