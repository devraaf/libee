import { describe, expect, it } from 'vitest';
import { mapAuthorNames } from '@/shared/utils/book-authors';
import { formatLibraryDate } from '@/shared/utils/format-date';

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
});
