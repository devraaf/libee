import { CalendarDays, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/shared/components/ui/Button';
import { Card } from '@/shared/components/ui/Card';
import { CoverImage } from '@/shared/components/ui/CoverImage';
import { EmptyState } from '@/shared/components/ui/EmptyState';
import { useReaderLoans } from '@/features/reader/reader-loans/hooks/useReaderLoans';
import {
  getBookPath,
  type ReaderLoan,
} from '@/features/reader/reader-loans/utils/readerLoans';

function formatDueDate(value: string): string {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return 'Data não disponível';

  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) return 'Data não disponível';

  return new Intl.DateTimeFormat('pt-BR', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(date);
}

function UpcomingReturnItem({ loan }: { loan: ReaderLoan }) {
  const content = (
    <>
      <CoverImage
        src={loan.coverUrl}
        alt={`Capa de ${loan.title}`}
        className="h-[90px] w-[60px] shrink-0 rounded-sm bg-surface"
      />
      <div className="flex min-w-0 flex-1 flex-col justify-between py-2">
        <div className="min-w-0">
          <h3 className="type-caption truncate font-semibold text-fg">
            {loan.title}
          </h3>
          <p className="type-caption mt-2 truncate text-muted">
            {loan.author ?? 'Autor não informado'}
            {loan.year && `, ${loan.year}`}
          </p>
        </div>
        <p className="type-caption flex items-center gap-1.5 text-fg">
          <CalendarDays size={13} aria-hidden="true" className="shrink-0" />
          <span>{formatDueDate(loan.dueDate)}</span>
        </p>
      </div>
      <ChevronRight
        size={14}
        aria-hidden="true"
        className="my-auto shrink-0 text-primary"
      />
    </>
  );

  return (
    <li className="border-b border-line/70 last:border-b-0">
      {loan.bookId === null ? (
        <div className="flex gap-2.5 py-2.5">{content}</div>
      ) : (
        <Link
          to={getBookPath(loan.bookId)}
          aria-label={`Ver detalhes de ${loan.title}`}
          className="flex gap-2.5 rounded-md py-2.5 focus-visible:outline"
        >
          {content}
        </Link>
      )}
    </li>
  );
}

function LoadingItems() {
  return (
    <div
      role="status"
      aria-label="Carregando próximas devoluções"
      aria-busy="true"
      className="space-y-2"
    >
      {[0, 1, 2].map((item) => (
        <div
          key={item}
          className="flex animate-pulse gap-2.5 border-b border-line/70 py-2.5 last:border-b-0"
        >
          <div className="h-[90px] w-[60px] shrink-0 rounded-sm bg-surface" />
          <div className="flex flex-1 flex-col justify-between py-3">
            <div className="space-y-2">
              <div className="h-3 w-4/5 rounded bg-surface" />
              <div className="h-3 w-3/5 rounded bg-surface" />
            </div>
            <div className="h-3 w-4/5 rounded bg-surface" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function UpcomingReturnsPanel() {
  const { active, error, isLoading, reload } = useReaderLoans(4);
  const upcomingReturns = active.slice(0, 3);

  return (
    <Card
      as="aside"
      tone="warm"
      aria-labelledby="upcoming-returns-title"
      className="w-full shrink-0 border-transparent p-4 lg:w-64"
    >
      <header className="mb-2 flex items-center justify-between gap-2">
        <h2
          id="upcoming-returns-title"
          className="type-small font-semibold text-fg"
        >
          Próximas devoluções
        </h2>
        <Link
          to="/emprestimos"
          className="type-caption shrink-0 text-primary hover:underline"
        >
          Ver todos <span aria-hidden="true">→</span>
        </Link>
      </header>

      {isLoading ? (
        <LoadingItems />
      ) : error ? (
        <EmptyState
          title="Não foi possível carregar as devoluções"
          description={error}
          action={
            <Button type="button" size="sm" variant="outline" onClick={reload}>
              Tentar novamente
            </Button>
          }
          className="px-1 py-8"
        />
      ) : upcomingReturns.length === 0 ? (
        <EmptyState
          title="Nenhuma devolução próxima"
          description="Você não possui empréstimos ativos."
          className="px-1 py-8"
        />
      ) : (
        <ul aria-label="Empréstimos ativos ordenados por data de devolução">
          {upcomingReturns.map((loan) => (
            <UpcomingReturnItem key={loan.id} loan={loan} />
          ))}
        </ul>
      )}
    </Card>
  );
}
