import { Link } from 'react-router-dom';
import { Button } from '../../../../shared/components/ui/Button';
import { CoverImage } from '../../../../shared/components/ui/CoverImage';
import { formatDate, getBookPath, type ReaderLoan } from '../utils/readerLoans';
import { Badge } from '@/shared/components/ui/Badge';

interface ReaderLoanHistoryCardProps {
  loan: ReaderLoan;
}

const Field = ({ label, value }: { label: string; value: string }) => (
  <div className="flex flex-col">
    <dt className="text-[11px] font-semibold text-muted">{label}</dt>
    <dd className="text-xs text-fg">{value}</dd>
  </div>
);

export default function ReaderLoanHistoryCard({
  loan,
}: ReaderLoanHistoryCardProps) {
  return (
    <article className="flex gap-3 rounded-lg border border-line bg-surface p-2.5 sm:gap-3">
      <CoverImage
        src={loan.coverUrl}
        alt={`Capa de ${loan.title}`}
        size='sm'
        className="h-21.5 w-14 shrink-0 rounded-md border border-line/40 bg-surface-warm"
      />

      <div className="flex min-w-0 flex-1 flex-col justify-between gap-2 py-0.5">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <h3 className="truncate type-body font-semibold text-fg">
              {loan.title}
            </h3>
            <p className="truncate type-caption text-muted">
              {loan.author ?? 'Autor não informado'}
            </p>
          </div>
          <Badge variant="neutral" className="shrink-0 px-2 py-0.5 text-[10px]">
            Devolvido
          </Badge>
        </div>

        <dl className="grid grid-cols-2 gap-x-3 gap-y-1 sm:grid-cols-3 sm:gap-x-4">
          <Field label="Tombo" value={loan.tombo ?? '—'} />
          <Field label="Emprestado em" value={formatDate(loan.loanDate)} />
          <Field label="Devolvido em" value={formatDate(loan.returnDate)} />
        </dl>

        <div>
          {loan.bookId !== null ? (
            <Link to={getBookPath(loan.bookId)}>
              <Button
                type="button"
                size="sm"
                variant="outline"
                aria-label={`Ver livro ${loan.title}`}
              >
                Ver livro
              </Button>
            </Link>
          ) : (
            <Button
              type="button"
              size="sm"
              variant="outline"
              disabled
              aria-label={`Ver livro ${loan.title}`}
            >
              Ver livro
            </Button>
          )}
        </div>
      </div>
    </article>
  );
}
