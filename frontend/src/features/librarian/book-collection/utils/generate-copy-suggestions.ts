import type { BookFormInput } from '../schemas/book.schema';

export interface CopySuggestion {
  accessionNumber: string;
  physicalLocation: string;
}

interface CopySuggestionResult {
  suggestions: CopySuggestion[];
  emptyCopyIndexes: number[];
}

export function generateCopySuggestions(
  copies: BookFormInput['copies'],
  quantity: number,
  defaultLocation: string,
  currentCopyCount: number,
): CopySuggestionResult | string {
  const normalizedQuantity = Math.floor(quantity);
  if (normalizedQuantity < 1) {
    return 'Informe uma quantidade maior que zero.';
  }

  const location =
    defaultLocation.trim() ||
    copies
      .find((copy) => copy.physicalLocation.trim())
      ?.physicalLocation.trim();

  if (!location) {
    return 'Informe uma localização ou preencha a localização do primeiro exemplar.';
  }

  const firstAccession = copies
    .find((copy) => copy.accessionNumber.trim())
    ?.accessionNumber.trim();
  const sequenceMatch = firstAccession?.match(/^(.*?)(\d+)$/);
  const prefix = sequenceMatch?.[1] ?? '';
  const initialNumber = sequenceMatch ? Number(sequenceMatch[2]) : 1;
  const padding = sequenceMatch?.[2].length ?? 3;
  const existingNumbers = new Set(
    copies.map((copy) => copy.accessionNumber.trim().toLocaleLowerCase()),
  );
  const emptyCopyIndexes = copies.reduce<number[]>((indexes, copy, index) => {
    if (!copy.accessionNumber.trim() && copy.copyId === undefined) {
      indexes.push(index);
    }
    return indexes;
  }, []);
  const copiesToGenerate =
    Math.max(0, normalizedQuantity - currentCopyCount) +
    emptyCopyIndexes.length;
  const suggestions: CopySuggestion[] = [];
  let nextNumber = initialNumber;

  while (suggestions.length < copiesToGenerate) {
    const accessionNumber = `${prefix}${String(nextNumber).padStart(padding, '0')}`;
    nextNumber += 1;

    if (existingNumbers.has(accessionNumber.toLocaleLowerCase())) {
      continue;
    }

    existingNumbers.add(accessionNumber.toLocaleLowerCase());
    suggestions.push({
      accessionNumber,
      physicalLocation: location,
    });
  }

  return { suggestions, emptyCopyIndexes };
}
