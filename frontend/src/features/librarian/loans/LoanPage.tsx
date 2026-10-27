import { useEffect, useMemo, useState } from 'react';
import { Plus } from 'lucide-react';
import { Button } from '../../../shared/components/ui/Button';
import { EmptyState } from '../../../shared/components/ui/EmptyState';
import { Loader } from '../../../shared/components/ui/Loader/Loader';
import { PageHeader } from '../../../shared/components/ui/PageHeader';
import SearchFilterBar from '../../../shared/components/ui/SearchFilterBar';
import { getBook, listCopies } from '../../catalog/services/books.service';
import { listReaders } from '../../readers/services/readers.service';
import { listLoans, returnLoan } from '../../loans/services/loans.service';
import { LoanStats } from './components/LoanStats';
import { LoanTable, type LoanTableItem } from './components/LoanTable';

const PAGE_SIZE = 10;

interface LoanStatsData {
  activeLoans: number;
  onTimeLoans: number;
  overdueLoans: number;
}

function formatDate(value: string): string {
  return new Date(`${value}T00:00:00`).toLocaleDateString('pt-BR');
}

function getErrorMessage(error: unknown): string {
  return error instanceof Error
    ? error.message
    : 'Não foi possível carregar os empréstimos.';
}

async function loadLoanItems(): Promise<LoanTableItem[]> {
  const [loans, copies, readers] = await Promise.all([
    listLoans(),
    listCopies(),
    listReaders(),
  ]);
  const bookIds = [
    ...new Set(
      loans.map((loan) => {
        const copy = copies.find(({ id }) => id === loan.copyId);
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
  const booksById = new Map(books.map((book) => [book.id, book]));
  const copiesById = new Map(copies.map((copy) => [copy.id, copy]));
  const readersById = new Map(readers.map((reader) => [reader.id, reader]));

  return loans.map((loan) => {
    const copy = copiesById.get(loan.copyId);
    const book = copy && booksById.get(copy.bookId);
    const reader = readersById.get(loan.readerId);
    if (!copy || !book || !reader) {
      throw new Error(
        `Não foi possível encontrar os dados relacionados ao empréstimo ${loan.id}.`,
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
    };
  });
}

function getStats(loans: LoanTableItem[]): LoanStatsData {
  const activeLoans = loans.filter((loan) => loan.status !== 'RETURNED');
  return {
    activeLoans: activeLoans.length,
    onTimeLoans: activeLoans.filter((loan) => loan.status === 'ON_TIME').length,
    overdueLoans: activeLoans.filter((loan) => loan.status === 'OVERDUE')
      .length,
  };
}

export default function LoanPage() {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [loans, setLoans] = useState<LoanTableItem[]>([]);
  const [stats, setStats] = useState<LoanStatsData>();
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [retry, setRetry] = useState(0);
  const [returningLoanId, setReturningLoanId] = useState<number | null>(null);

  useEffect(() => {
    let active = true;

    async function loadLoans() {
      setIsLoading(true);
      setLoadError(null);
      try {
        const items = await loadLoanItems();
        if (!active) return;
        setLoans(items);
        setStats(getStats(items));
      } catch (error) {
        if (active) setLoadError(getErrorMessage(error));
      } finally {
        if (active) setIsLoading(false);
      }
    }

    void loadLoans();
    return () => {
      active = false;
    };
  }, [retry]);

  const filteredLoans = useMemo(() => {
    const query = search.trim().toLocaleLowerCase();
    if (!query) return loans;
    return loans.filter(
      (loan) =>
        loan.title.toLocaleLowerCase().includes(query) ||
        loan.readerName.toLocaleLowerCase().includes(query) ||
        loan.accessionNumber.toLocaleLowerCase().includes(query),
    );
  }, [loans, search]);

  const totalPages = Math.max(1, Math.ceil(filteredLoans.length / PAGE_SIZE));
  const visibleLoans = filteredLoans.slice(
    (page - 1) * PAGE_SIZE,
    page * PAGE_SIZE,
  );

  function handleSearchChange(value: string) {
    setSearch(value);
    setPage(1);
  }

  async function handleReturn(loanId: number) {
    setReturningLoanId(loanId);
    setActionError(null);
    try {
      await returnLoan(loanId);
      setRetry((current) => current + 1);
    } catch (error) {
      setActionError(getErrorMessage(error));
    } finally {
      setReturningLoanId(null);
    }
  }

  return (
    <section className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-6 px-4 py-8 sm:px-8">
      <PageHeader
        title="Empréstimos"
        subtitle="Consulte os empréstimos e prazos de devolução"
        action={
          <Button type="button" leftIcon={<Plus size={16} />}>
            Registrar empréstimo
          </Button>
        }
      />

      <LoanStats {...stats} />

      <SearchFilterBar
        placeholder="Pesquise por leitor, livro ou tombo..."
        value={search}
        onChange={handleSearchChange}
      />

      {actionError && (
        <p className="type-small text-danger" role="alert">
          {actionError}
        </p>
      )}

      {isLoading ? (
        <div
          className="flex min-h-48 items-center justify-center"
          role="status"
          aria-label="Carregando empréstimos"
        >
          <Loader />
        </div>
      ) : loadError ? (
        <EmptyState
          title="Não foi possível carregar os empréstimos."
          description={loadError}
          action={
            <Button
              type="button"
              variant="outline"
              onClick={() => setRetry((current) => current + 1)}
            >
              Tentar novamente
            </Button>
          }
        />
      ) : (
        <LoanTable
          loans={visibleLoans}
          page={page}
          totalItems={filteredLoans.length}
          totalPages={totalPages}
          returningLoanId={returningLoanId}
          onPageChange={setPage}
          onReturn={handleReturn}
        />
      )}
    </section>
  );
}
