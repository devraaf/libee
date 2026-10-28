import { useEffect, useId, useMemo, useState } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2, Search } from 'lucide-react';
import { Badge } from '../../../../shared/components/ui/Badge';
import { Button } from '../../../../shared/components/ui/Button';
import Modal from '../../../../shared/components/ui/Modal';
import { getBook, listCopies } from '../../../catalog/services/books.service';
import { listCourses } from '../../../catalog/services/catalog.service';
import {
  createReader,
  listReaders,
} from '../../Readers/services/readers.service';
import CreateReaderForm from '../../Readers/components/CreateReaderForm';
import type { ReaderFormValues } from '../../Readers/types/reader.model';
import type { AffiliationType } from '../../../../shared/schemas/enums.schema';
import type { Copy, Course, Reader } from '../../../../shared/types/library';
import { dateFromToday } from '../../../../shared/mocks/dates';
import {
  registerLoanSchema,
  type RegisterLoanFormData,
} from '../schemas/loan.schema';

interface RegisterLoanFormProps {
  onCancel: () => void;
  onConfirm: (data: RegisterLoanFormData) => Promise<void>;
}

interface AvailableCopy extends Copy {
  title: string;
}

function getErrorMessage(error: unknown): string {
  return error instanceof Error
    ? error.message
    : 'Não foi possível carregar os dados para o empréstimo.';
}

const fieldClass =
  'w-full rounded-lg border border-line bg-surface px-3 py-2 text-sm text-fg placeholder:text-subtle focus:border-primary focus:outline-none';
const labelClass = 'type-label mb-1 block text-fg';
const errorClass = 'type-caption mt-1 block text-danger';

export default function RegisterLoanForm({
  onCancel,
  onConfirm,
}: RegisterLoanFormProps) {
  const formId = useId();
  const [copies, setCopies] = useState<AvailableCopy[]>([]);
  const [selectedReader, setSelectedReader] = useState<Reader | null>(null);
  const [readerSuggestions, setReaderSuggestions] = useState<Reader[]>([]);
  const [isLoadingOptions, setIsLoadingOptions] = useState(true);
  const [isSearchingReader, setIsSearchingReader] = useState(false);
  const [optionsError, setOptionsError] = useState<string | null>(null);
  const [readerSearchError, setReaderSearchError] = useState<string | null>(
    null,
  );
  const [readerNotFound, setReaderNotFound] = useState(false);
  const [copyError, setCopyError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [optionsRetry, setOptionsRetry] = useState(0);
  const [isCreateReaderOpen, setIsCreateReaderOpen] = useState(false);
  const [isLoadingCourses, setIsLoadingCourses] = useState(false);
  const [courses, setCourses] = useState<Course[]>([]);
  const [courseLoadError, setCourseLoadError] = useState<string | null>(null);
  const [readerCreatedMessage, setReaderCreatedMessage] = useState<
    string | null
  >(null);

  const {
    register,
    handleSubmit,
    setValue,
    control,
    formState: { errors },
  } = useForm<RegisterLoanFormData>({
    resolver: zodResolver(registerLoanSchema),
    defaultValues: {
      readerId: '',
      readerName: '',
      copyCode: '',
      dueDate: dateFromToday(7),
    },
  });

  const readerInput = useWatch({ control, name: 'readerName' }) ?? '';
  const copyCode = useWatch({ control, name: 'copyCode' }) ?? '';
  const selectedCopy = useMemo(
    () =>
      copies.find(
        (copy) =>
          copy.accessionNumber === copyCode.trim() ||
          String(copy.id) === copyCode.trim(),
      ),
    [copies, copyCode],
  );

  useEffect(() => {
    if (!readerCreatedMessage) return;
    const timeoutId = window.setTimeout(
      () => setReaderCreatedMessage(null),
      4000,
    );
    return () => window.clearTimeout(timeoutId);
  }, [readerCreatedMessage]);

  useEffect(() => {
    let active = true;

    async function loadOptions() {
      setIsLoadingOptions(true);
      setOptionsError(null);
      try {
        const copyRecords = await listCopies();
        const books = await Promise.all(
          [...new Set(copyRecords.map(({ bookId }) => bookId))].map(getBook),
        );
        if (!active) return;

        const booksById = new Map(books.map((book) => [book.id, book]));
        setCopies(
          copyRecords.map((copy) => {
            const book = booksById.get(copy.bookId);
            if (!book) {
              throw new Error(
                `O livro do exemplar ${copy.accessionNumber} não foi encontrado.`,
              );
            }
            return { ...copy, title: book.title };
          }),
        );
      } catch (error) {
        if (active) setOptionsError(getErrorMessage(error));
      } finally {
        if (active) setIsLoadingOptions(false);
      }
    }

    void loadOptions();
    return () => {
      active = false;
    };
  }, [optionsRetry]);

  async function handleSearchReader() {
    const query = readerInput.trim();
    if (!query) {
      setReaderSuggestions([]);
      setReaderNotFound(false);
      return;
    }

    setIsSearchingReader(true);
    setReaderSearchError(null);
    try {
      const matches = await listReaders(query);
      setReaderSuggestions(matches);
      setReaderNotFound(matches.length === 0);
    } catch (error) {
      setReaderSuggestions([]);
      setReaderNotFound(false);
      setReaderSearchError(getErrorMessage(error));
    } finally {
      setIsSearchingReader(false);
    }
  }

  function handleSelectReader(reader: Reader) {
    setSelectedReader(reader);
    setValue('readerId', String(reader.id), { shouldValidate: true });
    setValue('readerName', reader.name, { shouldValidate: true });
    setReaderSuggestions([]);
    setReaderNotFound(false);
    setReaderSearchError(null);
  }

  function handleReaderInputChange(value: string) {
    setValue('readerName', value, { shouldValidate: true });
    setValue('readerId', '', { shouldValidate: true });
    setSelectedReader(null);
    setReaderSuggestions([]);
    setReaderNotFound(false);
    setReaderSearchError(null);
  }

  async function handleOpenCreateReader() {
    setIsCreateReaderOpen(true);
    setCourseLoadError(null);
    setIsLoadingCourses(true);
    try {
      setCourses(await listCourses());
    } catch (error) {
      setCourseLoadError(getErrorMessage(error));
    } finally {
      setIsLoadingCourses(false);
    }
  }

  async function handleCreateReader(values: ReaderFormValues) {
    const affiliationType: AffiliationType =
      values.bond === 'student'
        ? 'STUDENT'
        : values.bond === 'teacher'
          ? 'PROFESSOR'
          : 'EMPLOYEE';
    const course = courses.find(({ name }) => name === values.course);
    const reader = await createReader({
      name: values.name.trim(),
      email: values.email.trim(),
      phone: values.phone.replace(/\D/g, ''),
      affiliationType,
      ...(affiliationType === 'STUDENT' && course
        ? { courseId: course.id }
        : {}),
    });

    handleSelectReader(reader);
    setIsCreateReaderOpen(false);
    setReaderCreatedMessage(`Leitor ${reader.name} cadastrado com sucesso.`);
  }

  function handleCopyCodeChange(value: string) {
    setValue('copyCode', value, { shouldValidate: true });
    const trimmedCode = value.trim();
    if (!trimmedCode) {
      setCopyError(null);
      return;
    }
    const copy = copies.find(
      (item) =>
        item.accessionNumber === trimmedCode || String(item.id) === trimmedCode,
    );
    if (!copy) {
      setCopyError('Exemplar inexistente no catálogo.');
    } else if (copy.status !== 'AVAILABLE') {
      setCopyError('Exemplar já se encontra emprestado.');
    } else {
      setCopyError(null);
    }
  }

  async function handleFormSubmit(data: RegisterLoanFormData) {
    if (copyError || !selectedCopy || selectedCopy.status !== 'AVAILABLE') {
      return;
    }
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
    <>
      {readerCreatedMessage && (
        <div
          role="status"
          className="fixed bottom-5 right-5 z-[60] rounded-lg bg-emerald-600 px-4 py-3 text-sm font-medium text-white shadow-lg"
        >
          {readerCreatedMessage}
        </div>
      )}
      <form
        onSubmit={handleSubmit(handleFormSubmit)}
        className="flex flex-col gap-4"
      >
        {optionsError && (
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="type-small text-danger" role="alert">
              {optionsError}
            </p>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOptionsRetry((current) => current + 1)}
            >
              Tentar novamente
            </Button>
          </div>
        )}

        {isLoadingOptions && (
          <p className="type-small text-muted" role="status">
            Carregando exemplares...
          </p>
        )}

        <input type="hidden" {...register('readerId')} />

        <div>
          <label htmlFor={`${formId}-reader-name`} className={labelClass}>
            Leitor (nome ou e-mail)
          </label>
          <div className="flex gap-2">
            <input
              id={`${formId}-reader-name`}
              {...register('readerName')}
              value={readerInput}
              onChange={(event) => handleReaderInputChange(event.target.value)}
              type="text"
              placeholder="Digite o nome ou e-mail do leitor"
              autoComplete="off"
              disabled={isSearchingReader}
              role="combobox"
              aria-autocomplete="list"
              aria-expanded={readerSuggestions.length > 0}
              aria-controls={`${formId}-reader-suggestions`}
              className={fieldClass}
            />
            <Button
              type="button"
              variant="outline"
              onClick={() => void handleSearchReader()}
              disabled={isSearchingReader}
              leftIcon={
                isSearchingReader ? (
                  <Loader2 size={14} className="animate-spin" />
                ) : (
                  <Search size={14} />
                )
              }
            >
              Buscar
            </Button>
          </div>
          {(errors.readerName || errors.readerId) && (
            <span className={errorClass}>
              {errors.readerName?.message ?? errors.readerId?.message}
            </span>
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
                  className="flex w-full flex-col px-3 py-2 text-left hover:bg-surface-hover"
                >
                  <span className="type-small font-semibold text-fg">
                    {reader.name}
                  </span>
                  <span className="type-caption text-muted">
                    {reader.email}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}

        {selectedReader && (
          <div className="flex items-center justify-between gap-3 rounded-lg border border-line bg-surface-warm p-3">
            <div className="type-caption text-fg">
              <p className="font-semibold">{selectedReader.name}</p>
              <p className="text-muted">{selectedReader.email}</p>
            </div>
            <Badge variant="success">Leitor selecionado</Badge>
          </div>
        )}

        {readerNotFound && (
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-warn-line bg-warn-bg p-3">
            <span className="type-small text-warn">
              Leitor não encontrado no sistema.
            </span>
            <Button
              type="button"
              size="sm"
              onClick={() => void handleOpenCreateReader()}
            >
              Cadastrar leitor
            </Button>
          </div>
        )}

        <div>
          <label htmlFor={`${formId}-copy-code`} className={labelClass}>
            Tombo do exemplar (ex.: 0001, 0002)
          </label>
          <input
            id={`${formId}-copy-code`}
            {...register('copyCode')}
            type="text"
            placeholder="Digite o código do tombo"
            onChange={(event) => handleCopyCodeChange(event.target.value)}
            className={fieldClass}
          />
          {copyError && <span className={errorClass}>{copyError}</span>}
          {errors.copyCode && (
            <span className={errorClass}>{errors.copyCode.message}</span>
          )}
        </div>

        {selectedCopy && !copyError && (
          <div className="flex items-center justify-between gap-3 rounded-lg border border-line bg-surface-warm p-3">
            <span className="type-small font-semibold text-fg">
              Título do livro: {selectedCopy.title}
            </span>
            <Badge variant="success">Disponível para empréstimo</Badge>
          </div>
        )}

        <div>
          <label htmlFor={`${formId}-due-date`} className={labelClass}>
            Devolução prevista
          </label>
          <input
            id={`${formId}-due-date`}
            {...register('dueDate')}
            type="date"
            min={dateFromToday(0)}
            className={fieldClass}
          />
          {errors.dueDate && (
            <span className={errorClass}>{errors.dueDate.message}</span>
          )}
        </div>

        <p className="type-caption text-muted">Registrado por Bibliotecário</p>

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
          <Button
            type="submit"
            disabled={
              isSubmitting ||
              isLoadingOptions ||
              Boolean(optionsError) ||
              Boolean(copyError) ||
              !selectedReader ||
              !selectedCopy
            }
          >
            {isSubmitting ? 'Registrando...' : 'Confirmar'}
          </Button>
        </div>
      </form>
      <Modal
        isOpen={isCreateReaderOpen}
        onClose={() => setIsCreateReaderOpen(false)}
        title="Cadastrar leitor"
      >
        {isLoadingCourses ? (
          <p className="type-small text-muted" role="status">
            Carregando cursos...
          </p>
        ) : courseLoadError ? (
          <div className="flex flex-col gap-3">
            <p className="type-small text-danger" role="alert">
              {courseLoadError}
            </p>
            <Button
              type="button"
              variant="outline"
              onClick={() => void handleOpenCreateReader()}
            >
              Tentar novamente
            </Button>
          </div>
        ) : (
          <CreateReaderForm
            onCancel={() => setIsCreateReaderOpen(false)}
            courseOptions={courses.map((course) => course.name)}
            onSubmit={handleCreateReader}
          />
        )}
      </Modal>
    </>
  );
}
