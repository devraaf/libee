import { useState } from 'react';
import { Button } from '../../../../shared/components/ui/Button';

export interface ReturnLoanDetails {
  loanId: number;
  copyCode: string;
  title: string;
  reader: string;
}

interface RegisterReturnFormProps {
  loan?: ReturnLoanDetails;
  onCancel: () => void;
  onConfirm: (accessionNumber: string) => Promise<void>;
}

export default function RegisterReturnForm({
  loan,
  onCancel,
  onConfirm,
}: RegisterReturnFormProps) {
  const [accessionNumber, setAccessionNumber] = useState(loan?.copyCode ?? '');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  async function handleConfirm() {
    const trimmedAccessionNumber = accessionNumber.trim();
    if (!trimmedAccessionNumber) {
      setSubmitError('Informe o tombo do exemplar.');
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);
    try {
      await onConfirm(trimmedAccessionNumber);
    } catch (error) {
      setSubmitError(
        error instanceof Error
          ? error.message
          : 'Não foi possível registrar a devolução.',
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      {loan ? (
        <p className="type-small text-fg">
          Devolver <strong className="font-semibold">"{loan.title}"</strong>{' '}
          (tombo{' '}
          <span className="font-mono font-semibold">{loan.copyCode}</span>),
          emprestado a <strong className="font-semibold">{loan.reader}</strong>?
          O exemplar voltará a ficar disponível.
        </p>
      ) : (
        <div>
          <label
            htmlFor="return-accession-number"
            className="type-label mb-1 block text-fg"
          >
            Tombo do exemplar
          </label>
          <input
            id="return-accession-number"
            type="text"
            value={accessionNumber}
            onChange={(event) => setAccessionNumber(event.target.value)}
            placeholder="Informe o tombo do exemplar"
            className="w-full rounded-lg border border-line bg-surface px-3 py-2 text-sm text-fg placeholder:text-subtle focus:border-primary focus:outline-none"
          />
        </div>
      )}

      {submitError && (
        <p className="type-small text-danger" role="alert">
          {submitError}
        </p>
      )}

      <div className="flex justify-end gap-3 pt-2">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={isSubmitting}
        >
          Cancelar
        </Button>
        <Button
          type="button"
          onClick={() => void handleConfirm()}
          disabled={isSubmitting}
        >
          {isSubmitting ? 'Registrando...' : 'Confirmar'}
        </Button>
      </div>
    </div>
  );
}
