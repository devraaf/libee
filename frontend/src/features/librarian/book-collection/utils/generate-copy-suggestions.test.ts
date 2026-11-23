import { describe, expect, it } from 'vitest';
import { generateCopySuggestions } from './generate-copy-suggestions';

describe('generateCopySuggestions', () => {
  it('rejects quantities smaller than one', () => {
    expect(generateCopySuggestions([], 0, 'Estante A-01', 0)).toBe(
      'Informe uma quantidade maior que zero.',
    );
  });

  it('requires a default or existing physical location', () => {
    expect(
      generateCopySuggestions(
        [{ accessionNumber: '001', physicalLocation: '' }],
        2,
        '',
        1,
      ),
    ).toBe(
      'Informe uma localização ou preencha a localização do primeiro exemplar.',
    );
  });

  it('fills empty copy fields and appends the remaining quantity', () => {
    const result = generateCopySuggestions(
      [
        { accessionNumber: '001', physicalLocation: 'Estante A-01' },
        { accessionNumber: '', physicalLocation: '' },
      ],
      3,
      '',
      2,
    );

    expect(result).toEqual({
      emptyCopyIndexes: [1],
      suggestions: [
        { accessionNumber: '002', physicalLocation: 'Estante A-01' },
        { accessionNumber: '003', physicalLocation: 'Estante A-01' },
      ],
    });
  });

  it('uses the existing sequence and skips numbers already in use', () => {
    const result = generateCopySuggestions(
      [
        { accessionNumber: 'T-001', physicalLocation: 'Estante B-02' },
        {
          copyId: 24,
          accessionNumber: 'T-002',
          physicalLocation: 'Estante B-02',
        },
      ],
      3,
      '',
      2,
    );

    expect(result).toEqual({
      emptyCopyIndexes: [],
      suggestions: [
        { accessionNumber: 'T-003', physicalLocation: 'Estante B-02' },
      ],
    });
  });
});
