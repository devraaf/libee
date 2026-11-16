import { useEffect, useRef, useState } from 'react';
import { Button } from '../../../../shared/components/ui/Button';
import { EmptyState } from '../../../../shared/components/ui/EmptyState';
import { PageHeader } from '../../../../shared/components/ui/PageHeader';
import { Pagination } from '../../../../shared/components/ui/Pagination';
import SearchFilterBar from '../../../../shared/components/ui/SearchFilterBar';
import ReaderLoanCard from '../components/ReaderLoanCard';
import {
  useReaderLoans,
  type ReaderLoanStatusFilter,
} from '../hooks/useReaderLoans';
import type { ReaderLoan } from '../utils/readerLoans';

type Toast = { type: 'success' | 'error'; message: string };

const Skeleton = () => (
  <div
    className="space-y-3"
    role="status"
    aria-label="Carregando empréstimos"
    aria-live="polite"
    aria-busy="true"
  >
    {[0, 1].map((item) => (
      <div
        key={item}
        aria-hidden="true"
        className="flex min-h-28 animate-pulse gap-4 rounded-xl border border-line bg-surface p-4"
      >
        <div className="h-24 w-16 shrink-0 rounded-md bg-surface-warm" />
        <div className="flex-1 space-y-2">
          <div className="h-3 w-1/3 rounded bg-surface-warm" />
          <div className="h-3 w-1/5 rounded bg-surface-warm" />
        </div>
      </div>
    ))}
  </div>
);

export default function ReaderLoansPage() {
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<ReaderLoanStatusFilter>('all');
  const [activePage, setActivePage] = useState(1);
  const [historyPage, setHistoryPage] = useState(1);
  const [renewingIds, setRenewingIds] = useState<Set<number>>(() => new Set());
  const [toast, setToast] = useState<Toast | null>(null);
  const renewingRef = useRef(new Set<number>());
  const retryingRef = useRef(false);
  const { isLoading, error, active, history, reload, renew } = useReaderLoans(
    search,
    status,
    activePage,
    historyPage,
  );

  useEffect(() => {
    if (!toast) return;
    const timeout = window.setTimeout(() => setToast(null), 4000);
    return () => window.clearTimeout(timeout);
  }, [toast]);

  useEffect(() => {
    if (!isLoading) retryingRef.current = false;
  }, [isLoading]);

  const handleRenew = async (loan: ReaderLoan) => {
    if (renewingRef.current.has(loan.id)) return;
    renewingRef.current.add(loan.id);
    setRenewingIds((current) => new Set(current).add(loan.id));
    setToast(null);
    try {
      await renew(loan.id);
      setToast({
        type: 'success',
        message: 'Empréstimo renovado com sucesso.',
      });
    } catch (error) {
      setToast({
        type: 'error',
        message:
          error instanceof Error
            ? error.message
            : 'Não foi possível renovar o empréstimo.',
      });
    } finally {
      renewingRef.current.delete(loan.id);
      setRenewingIds((current) => {
        const next = new Set(current);
        next.delete(loan.id);
        return next;
      });
    }
  };

  const handleRetry = () => {
    if (retryingRef.current) return;
    retryingRef.current = true;
    reload();
  };

  return (
    <section className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-5 px-4 py-6 sm:gap-6 sm:px-6 sm:py-8 lg:px-8">
      <PageHeader title="Empréstimos" subtitle="Confira os seus empréstimos" />
      {toast && (
        <div
          className={`fixed left-4 right-4 top-20 z-50 rounded-lg border px-4 py-3 text-sm shadow-lg sm:left-auto sm:max-w-sm ${
            toast.type === 'success'
              ? 'border-ok-line bg-ok-bg text-ok'
              : 'border-danger-line bg-danger-bg text-danger'
          }`}
          role={toast.type === 'error' ? 'alert' : 'status'}
        >
          {toast.message}
        </div>
      )}
      <div className="flex w-full max-w-5xl flex-col gap-5 sm:gap-6">
        <SearchFilterBar
          placeholder="Pesquise por título, autor..."
          value={search}
          onChange={(value) => {
            setSearch(value);
            setActivePage(1);
            setHistoryPage(1);
          }}
          filterContent={
            <label className="flex flex-col gap-2 text-sm text-fg">
              Situação
              <select
                value={status}
                onChange={(event) => {
                  setStatus(event.target.value as ReaderLoanStatusFilter);
                  setActivePage(1);
                }}
                className="min-h-11 rounded-lg border border-line bg-surface px-3 py-2 text-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
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
          <div role="alert">
            <EmptyState
              title="Não foi possível carregar os empréstimos"
              description={error}
              action={
                <Button
                  type="button"
                  size="md"
                  variant="outline"
                  onClick={handleRetry}
                >
                  Tentar novamente
                </Button>
              }
            />
          </div>
        ) : (
          <>
            <section
              aria-labelledby="active-loans-title"
              className="space-y-3 sm:space-y-4"
            >
              <div className="flex items-center gap-3 px-1">
                <h2
                  id="active-loans-title"
                  className="type-h3 font-semibold text-fg"
                >
                  Empréstimos ativos
                </h2>
                <hr className="flex-1 border-line" />
              </div>
              {active.totalElements === 0 &&
              !search.trim() &&
              status === 'all' ? (
                <EmptyState
                  title="Você não possui empréstimos ativos"
                  description="Seus empréstimos ativos aparecerão aqui."
                />
              ) : active.content.length === 0 ? (
                <EmptyState
                  title="Nenhum resultado encontrado"
                  description="Tente alterar a busca ou o filtro selecionado."
                />
              ) : (
                active.content.map((loan) => (
                  <ReaderLoanCard
                    key={loan.id}
                    loan={loan}
                    variant="active"
                    onRenew={handleRenew}
                    isRenewing={renewingIds.has(loan.id)}
                  />
                ))
              )}
              {active.totalPages > 1 && (
                <Pagination
                  page={active.page}
                  totalPages={active.totalPages}
                  onPageChange={setActivePage}
                  summary={`Mostrando ${active.content.length} de ${active.totalElements} empréstimos`}
                />
              )}
            </section>

            <section
              aria-labelledby="loan-history-title"
              className="space-y-3 pt-3"
            >
              <div className="mb-3 flex items-center gap-3 px-1">
                <h2
                  id="loan-history-title"
                  className="type-h3 font-semibold text-fg"
                >
                  Histórico
                </h2>
                <hr className="flex-1 border-line" />
              </div>
              {history.totalElements === 0 && !search.trim() ? (
                <EmptyState
                  title="Ainda não existem empréstimos devolvidos"
                  description="Os empréstimos devolvidos aparecerão aqui."
                />
              ) : history.content.length === 0 ? (
                <EmptyState
                  title="Nenhum resultado encontrado"
                  description="Tente alterar a busca para encontrar um empréstimo."
                />
              ) : (
                history.content.map((loan) => (
                  <ReaderLoanCard key={loan.id} loan={loan} variant="history" />
                ))
              )}
              {history.totalPages > 1 && (
                <Pagination
                  page={history.page}
                  totalPages={history.totalPages}
                  onPageChange={setHistoryPage}
                  summary={`Mostrando ${history.content.length} de ${history.totalElements} empréstimos`}
                />
              )}
            </section>
          </>
        )}
      </div>
    </section>
  );
}
