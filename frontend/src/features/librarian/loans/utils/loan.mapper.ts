import { formatLibraryDate } from '@/shared/utils/format-date';
import type {
  ActiveLoanDto,
  ReturnedLoanDto,
} from '@/features/librarian/loans/services/loans.service';
import type { LoanTableItem } from '../components/LoanTable';

export interface LoanRecordItem extends LoanTableItem {}

export interface ReturnRecordItem {
  id: number;
  title: string;
  copyCode: string;
  reader: string;
  returnDate: string;
}

export function mapActiveLoan(dto: ActiveLoanDto): LoanRecordItem {
  return {
    id: dto.id,
    title: dto.title,
    accessionNumber: dto.accessionNumber,
    readerName: dto.readerName,
    loanDate: formatLibraryDate(dto.loanDate),
    dueDate: formatLibraryDate(dto.dueDate),
    status: dto.status,
  };
}

export function mapReturnedLoan(dto: ReturnedLoanDto): ReturnRecordItem {
  return {
    id: dto.id,
    title: dto.title,
    copyCode: dto.accessionNumber,
    reader: dto.readerName,
    returnDate: formatLibraryDate(dto.returnDate),
  };
}
