import { useState } from 'react';
import { Button } from '../../../../shared/components/ui/Button';

export interface ReturnLoanDetails {
  loanId: number;
  copyCode: string;
  title: string;
  reader: string;
}

interface RegisterReturnFormProps {
  loan: ReturnLoanDetails;
  onCancel: () => void;
  onConfirm: () => Promise<void>;
}

export default function RegisterReturnForm({
  loan,
  onCancel,
  onConfirm,
}: RegisterReturnFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  async function handleConfirm() {
    setIsSubmitting(true);
    setSubmitError(null);
    try {
      await onConfirm();
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
      <p className="type-small text-fg">
        Devolver <strong className="font-semibold">"{loan.title}"</strong>{' '}
        (tombo <span className="font-mono font-semibold">{loan.copyCode}</span>
        ), emprestado a <strong className="font-semibold">{loan.reader}</strong>
        ? O exemplar voltará a ficar disponível.
      </p>

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
