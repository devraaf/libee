import {
  getBook,
  listCopies,
} from '@/features/reader/catalog/mock-services/books.service';

import type { Loan } from '@/shared/types/library';
import { listReaders } from '../../readers/services/readers.service';
import type { LoanTableItem } from '../components/LoanTable';
import { formatLibraryDate } from '@/shared/utils/format-date';

export interface LoanRecordItem extends LoanTableItem {
  returnDate: string | null;
}

export async function mapLoanRecords(loans: Loan[]): Promise<LoanRecordItem[]> {
  const [copies, readers] = await Promise.all([listCopies(), listReaders()]);
  const copyById = new Map(copies.map((copy) => [copy.id, copy]));
  const readerById = new Map(readers.map((reader) => [reader.id, reader]));
  const bookIds = [
    ...new Set(
      loans.map((loan) => {
        const copy = copyById.get(loan.copyId);
        if (!copy) {
          throw new Error(
            `O exemplar do empréstimo ${loan.id} não foi encontrado.`,
          );
        }
        return copy.bookId;
      }),
    ),
  ];
  const books = await Promise.all(bookIds.map((bookId) => getBook(bookId)));
  const bookById = new Map(books.map((book) => [book.id, book]));

  return loans.map((loan) => {
    const copy = copyById.get(loan.copyId);
    const book = copy && bookById.get(copy.bookId);
    const reader = readerById.get(loan.readerId);
    if (!copy || !book || !reader) {
      throw new Error(
        `Não foi possível carregar todos os dados do empréstimo ${loan.id}.`,
      );
    }

    return {
      id: loan.id,
      title: book.title,
      accessionNumber: copy.accessionNumber,
      readerName: reader.name,
      loanDate: formatLibraryDate(loan.loanDate),
      dueDate: formatLibraryDate(loan.dueDate),
      status: loan.status,
      returnDate: loan.returnDate,
    };
  });
}
