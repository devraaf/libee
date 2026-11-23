import { describe, expect, it } from 'vitest';
import { mapAuthorNames } from '@/shared/utils/book-authors';
import { formatLibraryDate } from '@/shared/utils/format-date';
import { maskPhone } from '@/shared/utils/format-phone';

describe('shared display adapters', () => {
  it('maps API author names without creating artificial identifiers', () => {
    expect(mapAuthorNames(['Ada Lovelace', 'Grace Hopper'])).toEqual([
      'Ada Lovelace',
      'Grace Hopper',
    ]);
    expect(mapAuthorNames([{ name: 'Ursula Le Guin' }])).toEqual([
      'Ursula Le Guin',
    ]);
  });

  it('formats ISO dates consistently and preserves year-only publication dates', () => {
    expect(formatLibraryDate('2026-11-10')).toBe('10/11/2026');
    expect(formatLibraryDate('2003')).toBe('2003');
    expect(formatLibraryDate(null)).toBe('—');
    expect(
      formatLibraryDate('2026-02-30', undefined, 'Data indisponível'),
    ).toBe('Data indisponível');
  });

  it('formats phone numbers for forms and tables', () => {
    expect(maskPhone('11999999999')).toBe('(11) 99999-9999');
    expect(maskPhone('1133334444')).toBe('(11) 3333-4444');
  });
});
