import { Button } from '../../../../shared/components/ui/Button';
import { formatDate, type ReaderLoan } from '../utils/reader-loans';
import BookCover from '../components/book-cover';

interface ReaderLoanCardProps {
  loan: ReaderLoan;
  onRenew?: (loan: ReaderLoan) => void;
  onViewBook: (bookId: number) => void;
}

const Field = ({ label, value }: { label: string; value: string }) => (
  <div className="flex flex-col">
    <dt className="text-[11px] font-semibold text-muted">{label}</dt>
    <dd className="text-xs text-fg">{value}</dd>
  </div>
);

export default function ReaderLoanCard({ loan, onRenew, onViewBook }: ReaderLoanCardProps) {
  const overdue = loan.status === 'overdue';

  return (
    <article className="flex flex-col gap-4 rounded-lg border border-line bg-surface p-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex gap-4">
        <BookCover src={loan.coverUrl} title={loan.title} />

        <div className="flex flex-col justify-between py-0.5">
          <div>
            <h3 className="text-xs font-semibold text-fg">{loan.title}</h3>
            <p className="text-[11px] text-muted">{loan.author ?? 'Autor não informado'}</p>
          </div>

          <dl className="grid grid-cols-2 gap-x-8 gap-y-2 sm:flex sm:flex-wrap sm:gap-x-8">
            <Field label="Tombo" value={loan.tombo ?? '—'} />
            <Field label="Emprestado em" value={formatDate(loan.loanDate)} />
            <Field label="Devolução prevista" value={formatDate(loan.dueDate)} />
            <Field label="Renovações" value={String(loan.renewalCount)} />
          </dl>

          <div className="flex items-center gap-2 pt-1">
            <Button
              type="button"
              size="sm"
              disabled={overdue}
              onClick={() => onRenew?.(loan)}
              aria-label={`Renovar empréstimo de ${loan.title}`}
            >
              Renovar
            </Button>
            <Button
              type="button"
              size="sm"
              variant="outline"
              disabled={loan.bookId === null}
              onClick={() => loan.bookId !== null && onViewBook(loan.bookId)}
              aria-label={`Ver livro ${loan.title}`}
            >
              Ver livro
            </Button>
          </div>
        </div>
      </div>

      <div className="flex justify-end sm:self-start">
        <span
          className={
            overdue
              ? 'rounded-full border border-[#F2B8B8] bg-[#FDECEC] px-3 py-1 text-[10px] text-[#9B1C1C]'
              : 'rounded-full border border-[#BFE3C6] bg-[#E8F6EA] px-3 py-1 text-[10px] text-[#1F6B2E]'
          }
        >
          {overdue ? 'Atrasado' : 'Em dia'}
        </span>
      </div>
    </article>
  );
}