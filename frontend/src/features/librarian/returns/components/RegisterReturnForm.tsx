import { useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { Button } from '../../../../shared/components/ui/Button';
import { Input } from '../../../../shared/components/ui/Input';
import {
  returnFormSchema,
  type ReturnFormValues,
} from '../schemas/return.schema';

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
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ReturnFormValues>({
    resolver: zodResolver(returnFormSchema),
    defaultValues: { copyCode: loan?.copyCode ?? '' },
  });

  async function handleConfirm({ copyCode }: ReturnFormValues) {
    setIsSubmitting(true);
    setSubmitError(null);
    try {
      await onConfirm(copyCode);
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
    <form
      onSubmit={handleSubmit(handleConfirm)}
      className="flex flex-col gap-6"
      noValidate
    >
      {loan ? (
        <p className="type-small text-fg">
          Devolver <strong className="font-semibold">"{loan.title}"</strong>{' '}
          (tombo{' '}
          <span className="font-mono font-semibold">{loan.copyCode}</span>),
          emprestado a <strong className="font-semibold">{loan.reader}</strong>?
          O exemplar voltará a ficar disponível.
        </p>
      ) : (
        <Input
          id="return-accession-number"
          type="text"
          {...register('copyCode')}
          density="compact"
          label="Tombo do exemplar"
          placeholder="Informe o tombo do exemplar"
          error={errors.copyCode?.message}
        />
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
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Registrando...' : 'Confirmar'}
        </Button>
      </div>
    </form>
  );
}
