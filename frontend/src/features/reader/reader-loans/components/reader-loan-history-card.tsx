import { Button } from '../../../../shared/components/ui/Button';
import { formatDate, type ReaderLoan } from '../utils/reader-loans';
import BookCover from './book-cover';

interface ReaderLoanHistoryCardProps {
  loan: ReaderLoan;
  onViewBook: (bookId: number) => void;
}

const Field = ({ label, value }: { label: string; value: string }) => (
  <div className="flex flex-col">
    <dt className="text-[11px] font-semibold text-muted">{label}</dt>
    <dd className="text-xs text-fg">{value}</dd>
  </div>
);

export default function ReaderLoanHistoryCard({ loan, onViewBook }: ReaderLoanHistoryCardProps) {
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
            <Field label="Devolvido em" value={formatDate(loan.returnDate)} />
          </dl>

          <div>
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
        <span className="rounded-full border border-line bg-surface-warm px-3 py-1 text-[10px] text-subtle">
          Devolvido
        </span>
      </div>
    </article>
  );
}