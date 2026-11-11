import { useEffect, useId, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { X } from 'lucide-react';
import { Badge } from '../../../../shared/components/ui/Badge';
import { Button } from '../../../../shared/components/ui/Button';
import { IconButton } from '../../../../shared/components/ui/IconButton';
import { dateFromToday } from '../../../../shared/utils/date';
import RegisterReaderModal from '../../readers/components/RegisterReaderModal';
import type { RegisteredReader } from '@/features/auth/services/auth.service';
import {
  searchReadersForLoan,
  type LoanReaderOption,
} from '../../readers/services/readers.service';
import {
  registerLoanSchema,
  type RegisterLoanFormData,
} from '../schemas/loan.schema';

interface RegisterLoanFormProps {
  onCancel: () => void;
  onConfirm: (data: RegisterLoanFormData) => Promise<void>;
}

function getErrorMessage(error: unknown): string {
  return error instanceof Error
    ? error.message
    : 'Não foi possível concluir a operação.';
}

const fieldClass =
  'w-full rounded-lg border border-line bg-surface px-3 py-2 text-sm text-fg placeholder:text-subtle focus:border-primary focus:outline-none';
const labelClass = 'type-label mb-1 block text-fg';
const errorClass = 'type-caption mt-1 block text-danger';

const readerStatusLabel: Record<LoanReaderOption['status'], string> = {
  REGULAR: 'Regular',
  PENDING: 'Pendente',
};

export default function RegisterLoanForm({
  onCancel,
  onConfirm,
}: RegisterLoanFormProps) {
  const formId = useId();
  const [readerSearch, setReaderSearch] = useState('');
  const [selectedReader, setSelectedReader] = useState<LoanReaderOption | null>(
    null,
  );
  const [readerSuggestions, setReaderSuggestions] = useState<
    LoanReaderOption[]
  >([]);
  const [isSearchingReader, setIsSearchingReader] = useState(false);
  const [readerSearchError, setReaderSearchError] = useState<string | null>(
    null,
  );
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isRegisterReaderOpen, setIsRegisterReaderOpen] = useState(false);
  const [readerRegisteredMessage, setReaderRegisteredMessage] = useState<
    string | null
  >(null);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<RegisterLoanFormData>({
    resolver: zodResolver(registerLoanSchema),
    defaultValues: {
      readerId: 0,
      accessionNumber: '',
      dueDate: dateFromToday(7),
    },
  });

  useEffect(() => {
    const query = readerSearch.trim();
    if (!query || selectedReader?.name === readerSearch) return;
    let active = true;
    const timeoutId = window.setTimeout(() => {
      void searchReadersForLoan(query)
        .then((readers) => {
          if (!active) return;
          setReaderSuggestions(readers);
        })
        .catch((error: unknown) => {
          if (!active) return;
          setReaderSuggestions([]);
          setReaderSearchError(getErrorMessage(error));
        })
        .finally(() => {
          if (active) setIsSearchingReader(false);
        });
    }, 300);

    return () => {
      active = false;
      window.clearTimeout(timeoutId);
    };
  }, [readerSearch, selectedReader]);

  function handleReaderSearchChange(value: string) {
    setReaderSearch(value);
    setReaderRegisteredMessage(null);
    setSelectedReader(null);
    setReaderSuggestions([]);
    setReaderSearchError(null);
    setIsSearchingReader(Boolean(value.trim()));
    setValue('readerId', 0, { shouldValidate: true });
  }

  function handleSelectReader(reader: LoanReaderOption) {
    setSelectedReader(reader);
    setReaderSearch(reader.name);
    setReaderSuggestions([]);
    setReaderSearchError(null);
    setIsSearchingReader(false);
    setValue('readerId', reader.id, { shouldValidate: true });
  }

  function handleReaderRegistered(reader: RegisteredReader) {
    const selected: LoanReaderOption = {
      id: reader.id,
      name: reader.name,
      email: reader.email,
      status: 'REGULAR',
    };
    handleSelectReader(selected);
    setIsRegisterReaderOpen(false);
    setReaderRegisteredMessage(
      `Leitor "${reader.name}" cadastrado e selecionado.`,
    );
  }

  async function handleFormSubmit(data: RegisterLoanFormData) {
    setSubmitError(null);
    setIsSubmitting(true);
    try {
      await onConfirm(data);
    } catch (error) {
      setSubmitError(getErrorMessage(error));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit(handleFormSubmit)}
      className="flex flex-col gap-4"
    >
      <div>
        <label htmlFor={`${formId}-reader`} className={labelClass}>
          Leitor (nome ou e-mail)
        </label>
        <div className="relative">
          <input
            id={`${formId}-reader`}
            type="text"
            value={readerSearch}
            onChange={(event) => handleReaderSearchChange(event.target.value)}
            placeholder="Digite o nome ou e-mail do leitor"
            autoComplete="off"
            role="combobox"
            aria-autocomplete="list"
            aria-expanded={readerSuggestions.length > 0}
            aria-controls={`${formId}-reader-suggestions`}
            className={`${fieldClass} ${readerSearch ? 'pr-11' : ''}`}
          />
          {readerSearch && (
            <IconButton
              label="Limpar leitor"
              icon={<X size={16} aria-hidden="true" />}
              size="sm"
              onClick={() => handleReaderSearchChange('')}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-muted hover:text-fg"
            />
          )}
        </div>
        {errors.readerId && (
          <span className={errorClass}>{errors.readerId.message}</span>
        )}
        {isSearchingReader && (
          <p className="type-caption mt-1 text-muted" role="status">
            Buscando leitores...
          </p>
        )}
        {readerSearchError && (
          <p className={errorClass} role="alert">
            {readerSearchError}
          </p>
        )}
      </div>

      {readerSuggestions.length > 0 && (
        <ul
          id={`${formId}-reader-suggestions`}
          role="listbox"
          aria-label="Sugestões de leitores"
          className="-mt-3 max-h-48 overflow-y-auto rounded-lg border border-line bg-surface"
        >
          {readerSuggestions.map((reader) => (
            <li key={reader.id} role="option" aria-selected={false}>
              <button
                type="button"
                onClick={() => handleSelectReader(reader)}
                className="flex w-full items-center justify-between gap-3 px-3 py-2 text-left hover:bg-surface-hover"
              >
                <span className="flex min-w-0 flex-col">
                  <span className="type-small font-semibold text-fg">
                    {reader.name}
                  </span>
                  <span className="type-caption truncate text-muted">
                    {reader.email}
                  </span>
                </span>
                <Badge
                  variant={reader.status === 'REGULAR' ? 'success' : 'neutral'}
                >
                  {readerStatusLabel[reader.status]}
                </Badge>
              </button>
              {reader.status === 'PENDING' && (
                <p className="px-3 pb-2 type-caption text-warn">
                  Atenção: este leitor possui empréstimo em atraso.
                </p>
              )}
            </li>
          ))}
        </ul>
      )}

      {readerSearch.trim() &&
        !selectedReader &&
        !isSearchingReader &&
        !readerSearchError &&
        readerSuggestions.length === 0 && (
          <div className="-mt-3 flex flex-wrap items-center justify-between gap-2 rounded-lg border border-line bg-surface-warm p-3">
            <p className="type-caption text-muted">Nenhum leitor encontrado.</p>
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => setIsRegisterReaderOpen(true)}
            >
              Leitor não encontrado? Cadastrar leitor
            </Button>
          </div>
        )}

      {readerRegisteredMessage && (
        <p className="-mt-3 type-caption text-ok" role="status">
          {readerRegisteredMessage}
        </p>
      )}

      {selectedReader && (
        <div className="flex items-center justify-between gap-3 rounded-lg border border-line bg-surface-warm p-3">
          <div className="type-caption text-fg">
            <p className="font-semibold">{selectedReader.name}</p>
            <p className="text-muted">{selectedReader.email}</p>
          </div>
          <Badge
            variant={
              selectedReader.status === 'REGULAR' ? 'success' : 'neutral'
            }
          >
            {readerStatusLabel[selectedReader.status]}
          </Badge>
        </div>
      )}
      {selectedReader?.status === 'PENDING' && (
        <div
          className="-mt-3 rounded-lg border border-warn-line bg-warn-bg p-3 type-small text-warn"
          role="alert"
        >
          <strong>Atenção:</strong> este leitor possui empréstimo em atraso.
          Confira a situação antes de registrar um novo empréstimo.
        </div>
      )}

      <div>
        <label htmlFor={`${formId}-accession-number`} className={labelClass}>
          Tombo do exemplar
        </label>
        <input
          id={`${formId}-accession-number`}
          {...register('accessionNumber')}
          type="text"
          placeholder="Digite o tombo do exemplar"
          className={fieldClass}
        />
        {errors.accessionNumber && (
          <span className={errorClass}>{errors.accessionNumber.message}</span>
        )}
      </div>

      <div>
        <label htmlFor={`${formId}-due-date`} className={labelClass}>
          Devolução prevista
        </label>
        <input
          id={`${formId}-due-date`}
          {...register('dueDate')}
          type="date"
          min={dateFromToday(1)}
          className={fieldClass}
        />
        {errors.dueDate && (
          <span className={errorClass}>{errors.dueDate.message}</span>
        )}
      </div>

      {submitError && (
        <p className="type-small text-danger" role="alert">
          {submitError}
        </p>
      )}

      <div className="mt-2 flex justify-end gap-2">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={isSubmitting}
        >
          Cancelar
        </Button>
        <Button type="submit" disabled={isSubmitting || !selectedReader}>
          {isSubmitting ? 'Registrando...' : 'Confirmar'}
        </Button>
      </div>
      <RegisterReaderModal
        open={isRegisterReaderOpen}
        onClose={() => setIsRegisterReaderOpen(false)}
        onSuccess={handleReaderRegistered}
        initialValue={readerSearch}
      />
    </form>
  );
}
