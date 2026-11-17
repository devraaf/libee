import { Link } from 'react-router-dom';
import { Button } from '../../../../shared/components/ui/Button';
import { CoverImage } from '../../../../shared/components/ui/CoverImage';
import { formatDate, getBookPath, type ReaderLoan } from '../utils/readerLoans';
import { Badge, type BadgeVariant } from '@/shared/components/ui/Badge';

type ReaderLoanCardProps =
  | {
      loan: ReaderLoan;
      variant: 'active';
      onRenew: (loan: ReaderLoan) => void;
      isRenewing?: boolean;
    }
  | {
      loan: ReaderLoan;
      variant: 'history';
    };

const Field = ({ label, value }: { label: string; value: string }) => (
  <div className="flex flex-col">
    <dt className="type-caption font-semibold text-muted">{label}</dt>
    <dd className="type-small wrap-break-word text-fg">{value}</dd>
  </div>
);

export default function ReaderLoanCard(props: ReaderLoanCardProps) {
  const { loan, variant } = props;
  const isHistory = variant === 'history';
  const overdue = !isHistory && loan.status === 'overdue';
  const statusVariant: BadgeVariant = isHistory
    ? 'neutral'
    : overdue
      ? 'danger'
      : 'success';
  const fields = [
    { label: 'Tombo', value: loan.tombo ?? '—' },
    { label: 'Emprestado em', value: formatDate(loan.loanDate) },
    {
      label: isHistory ? 'Devolvido em' : 'Devolução prevista',
      value: formatDate(isHistory ? loan.returnDate : loan.dueDate),
    },
    ...(!isHistory
      ? [{ label: 'Renovações', value: String(loan.renewalCount) }]
      : []),
  ];

  return (
    <article className="grid grid-cols-[4rem_minmax(0,1fr)] gap-3 rounded-xl border border-line bg-surface p-3 shadow-card transition-shadow hover:shadow-md sm:grid-cols-[4.5rem_minmax(0,1fr)] sm:gap-4 sm:p-4">
      <CoverImage
        src={loan.coverUrl}
        alt={`Capa de ${loan.title}`}
        size="sm"
        className="h-24 w-16 self-start rounded-md border border-line/40 bg-surface-warm sm:h-28 sm:w-18"
      />

      <div className="flex min-w-0 flex-col gap-3 py-0.5">
        <div className="flex flex-wrap items-start justify-between gap-x-3 gap-y-1">
          <div className="min-w-0">
            <h3 className="wrap-break-word type-body font-semibold text-fg">
              {loan.title}
            </h3>
            <p className="wrap-break-word type-small text-muted">
              {loan.author ?? 'Autor não informado'}
            </p>
          </div>
          <Badge
            variant={statusVariant}
            className="shrink-0 px-2 py-0.5 text-xs"
          >
            {isHistory ? 'Devolvido' : overdue ? 'Atrasado' : 'Em dia'}
          </Badge>
        </div>

        <dl
          className={`grid grid-cols-2 gap-x-3 gap-y-2 sm:gap-x-5 ${
            isHistory ? 'sm:grid-cols-3' : 'sm:grid-cols-2 lg:grid-cols-4'
          }`}
        >
          {fields.map(({ label, value }) => (
            <Field key={label} label={label} value={value} />
          ))}
        </dl>

        <div className="flex flex-wrap items-center gap-2 pt-1">
          {props.variant === 'active' && (
            <Button
              type="button"
              size="md"
              className="min-h-11"
              disabled={props.isRenewing}
              onClick={() => props.onRenew(loan)}
              aria-label={`Renovar empréstimo de ${loan.title}`}
              aria-busy={props.isRenewing}
            >
              {props.isRenewing ? 'Renovando...' : 'Renovar'}
            </Button>
          )}

          {loan.bookId !== null ? (
            <Link
              to={getBookPath(loan.bookId)}
              className="inline-flex min-h-11 items-center justify-center rounded-xl border border-line-strong bg-surface px-4 text-sm font-semibold text-fg transition-colors hover:bg-surface-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
              aria-label={`Ver livro ${loan.title}`}
            >
              Ver livro
            </Link>
          ) : (
            <Button
              type="button"
              size="md"
              variant="outline"
              className="min-h-11"
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
