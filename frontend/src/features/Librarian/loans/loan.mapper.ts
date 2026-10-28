import { getBook, listCopies } from '../../catalog/services/books.service';
import { listReaders } from '../Readers/services/readers.service';
import type { Loan } from '../../../shared/types/library';
import type { LoanTableItem } from './components/LoanTable';

export interface LoanRecordItem extends LoanTableItem {
  returnDate: string | null;
}

function formatDate(value: string): string {
  return new Date(`${value}T12:00:00`).toLocaleDateString('pt-BR');
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
      loanDate: formatDate(loan.loanDate),
      dueDate: formatDate(loan.dueDate),
      status: loan.status,
      returnDate: loan.returnDate,
    };
  });
}
