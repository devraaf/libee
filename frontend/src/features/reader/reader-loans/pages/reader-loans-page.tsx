import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../../../../shared/components/ui/Button';
import ReaderLoanCard from '../components/reader-loan-card';
import ReaderLoanFilters, { type StatusFilter } from '../components/reader-loan-filters';
import ReaderLoanHistoryCard from '../components/reader-loan-history-card';
import { useReaderLoans } from '../hooks/use-reader-loans';
import { getBookPath } from '../utils/reader-loans';

interface ReaderLoansPageProps {
  readerId?: number;
}

const Message = ({ children }: { children: string }) => (
  <p className="rounded-lg border border-dashed border-line px-4 py-6 text-center text-xs text-muted">
    {children}
  </p>
);

const Skeleton = () => (
  <div className="space-y-2" role="status" aria-label="Carregando empréstimos">
    {[0, 1].map((item) => (
      <div
        key={item}
        className="flex h-[140px] animate-pulse gap-3 rounded-lg border border-line bg-surface p-3"
      >
        <div className="h-[116px] w-[76px] rounded-md bg-surface-warm" />
        <div className="flex-1 space-y-2">
          <div className="h-3 w-1/3 rounded bg-surface-warm" />
          <div className="h-3 w-1/5 rounded bg-surface-warm" />
        </div>
      </div>
    ))}
  </div>
);

export default function ReaderLoansPage({ readerId }: ReaderLoansPageProps) {
  const navigate = useNavigate();
  const { isLoading, error, active, history, reload } = useReaderLoans(readerId);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<StatusFilter>('all');

  const filteredActive = useMemo(() => {
    const term = search.trim().toLocaleLowerCase();
    return active.filter((loan) => {
      const matchesText =
        !term ||
        loan.title.toLocaleLowerCase().includes(term) ||
        (loan.author ?? '').toLocaleLowerCase().includes(term);
      const matchesStatus = status === 'all' || loan.status === status;
      return matchesText && matchesStatus;
    });
  }, [active, search, status]);

  const handleViewBook = (bookId: number) => navigate(getBookPath(bookId));

  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-10">
      <header className="mb-6">
        <h1 className="text-2xl font-semibold">Empréstimos</h1>
        <p className="text-xs text-muted">Confira os seus empréstimos</p>
      </header>

      {readerId === undefined ? (
        <Message>Não foi possível identificar o leitor para exibir os empréstimos.</Message>
      ) : (
        <div className="space-y-4">
          <ReaderLoanFilters
            search={search}
            status={status}
            onSearchChange={setSearch}
            onStatusChange={setStatus}
          />

          {isLoading ? (
            <Skeleton />
          ) : error ? (
            <div className="flex flex-col items-center gap-3 rounded-lg border border-line px-4 py-6 text-center">
              <p className="text-xs text-danger" role="alert">
                {error}
              </p>
              <Button type="button" size="sm" variant="outline" onClick={reload}>
                Tentar novamente
              </Button>
            </div>
          ) : (
            <>
              <section aria-label="Empréstimos ativos" className="space-y-3">
                {active.length === 0 ? (
                  <Message>Você não possui empréstimos ativos.</Message>
                ) : filteredActive.length === 0 ? (
                  <Message>Nenhum empréstimo encontrado para a busca ou o filtro selecionado.</Message>
                ) : (
                  filteredActive.map((loan) => (
                    <ReaderLoanCard key={loan.id} loan={loan} onViewBook={handleViewBook} />
                  ))
                )}
              </section>

              <section aria-labelledby="loan-history-title" className="space-y-3 pt-8">
                <div className="mb-3 flex items-center gap-3">
                  <h2 id="loan-history-title" className="px-1 text-lg font-semibold">
                    Histórico
                  </h2>
                  <hr className="flex-1 border-line" />
                </div>
                {history.length === 0 ? (
                  <Message>Ainda não existem empréstimos devolvidos.</Message>
                ) : (
                  history.map((loan) => (
                    <ReaderLoanHistoryCard key={loan.id} loan={loan} onViewBook={handleViewBook} />
                  ))
                )}
              </section>
            </>
          )}
        </div>
      )}
    </div>
  );
}