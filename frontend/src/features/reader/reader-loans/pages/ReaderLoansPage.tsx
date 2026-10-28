import { useMemo, useState } from 'react';
import { Button } from '../../../../shared/components/ui/Button';
import { EmptyState } from '../../../../shared/components/ui/EmptyState';
import { PageHeader } from '../../../../shared/components/ui/PageHeader';
import SearchFilterBar from '../../../../shared/components/ui/SearchFilterBar';
import ReaderLoanCard from '../components/ReaderLoanCard';
import ReaderLoanHistoryCard from '../components/ReaderLoanHistoryCard';
import { useReaderLoans } from '../hooks/useReaderLoans';

interface ReaderLoansPageProps {
  readerId?: number;
}

type StatusFilter = 'all' | 'on_time' | 'overdue';

const Skeleton = () => (
  <div className="space-y-3" role="status" aria-label="Carregando empréstimos">
    {[0, 1].map((item) => (
      <div
        key={item}
        className="flex h-[106px] animate-pulse gap-3 rounded-lg border border-line bg-surface p-2.5"
      >
        <div className="h-[86px] w-14 rounded-md bg-surface-warm" />
        <div className="flex-1 space-y-2">
          <div className="h-3 w-1/3 rounded bg-surface-warm" />
          <div className="h-3 w-1/5 rounded bg-surface-warm" />
        </div>
      </div>
    ))}
  </div>
);

export default function ReaderLoansPage({ readerId }: ReaderLoansPageProps) {
  const { isLoading, error, active, history, reload } =
    useReaderLoans(readerId);
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

  return (
    <section className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-6 px-4 py-8 sm:px-8">
      <PageHeader title="Empréstimos" subtitle="Confira os seus empréstimos" />
      {readerId === undefined ? (
        <EmptyState
          title="Não foi possível identificar o leitor"
          description="Entre novamente para consultar seus empréstimos."
        />
      ) : (
        <div className="flex w-full max-w-2xl flex-col gap-4">
          <SearchFilterBar
            placeholder="Pesquise por título, autor..."
            value={search}
            onChange={setSearch}
            filterContent={
              <label className="flex flex-col gap-2 text-sm text-fg">
                Situação
                <select
                  value={status}
                  onChange={(event) =>
                    setStatus(event.target.value as StatusFilter)
                  }
                  className="rounded-lg border border-line bg-surface px-3 py-2 text-sm"
                >
                  <option value="all">Todas as situações</option>
                  <option value="on_time">Em dia</option>
                  <option value="overdue">Atrasado</option>
                </select>
              </label>
            }
          />

          {isLoading ? (
            <Skeleton />
          ) : error ? (
            <EmptyState
              title="Não foi possível carregar os empréstimos"
              description={error}
              action={
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={reload}
                >
                  Tentar novamente
                </Button>
              }
            />
          ) : (
            <>
              <section aria-label="Empréstimos ativos" className="space-y-3">
                {active.length === 0 ? (
                  <EmptyState
                    title="Você não possui empréstimos ativos"
                    description="Seus empréstimos ativos aparecerão aqui."
                  />
                ) : filteredActive.length === 0 ? (
                  <EmptyState
                    title="Nenhum resultado encontrado"
                    description="Tente alterar a busca ou o filtro selecionado."
                  />
                ) : (
                  filteredActive.map((loan) => (
                    <ReaderLoanCard key={loan.id} loan={loan} />
                  ))
                )}
              </section>

              <section
                aria-labelledby="loan-history-title"
                className="space-y-3 pt-3"
              >
                <div className="mb-3 flex items-center gap-3 px-1">
                  <h2
                    id="loan-history-title"
                    className="whitespace-nowrap type-h3 font-semibold lg:type-h2"
                  >
                    Histórico
                  </h2>
                  <hr className="flex-1 border-line" />
                </div>
                {history.length === 0 ? (
                  <EmptyState
                    title="Ainda não existem empréstimos devolvidos"
                    description="Os empréstimos devolvidos aparecerão aqui."
                  />
                ) : (
                  history.map((loan) => (
                    <ReaderLoanHistoryCard key={loan.id} loan={loan} />
                  ))
                )}
              </section>
            </>
          )}
        </div>
      )}
    </section>
  );
}
