import { useState } from 'react';
import { FormProvider, useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { AlertCircle, Check, Loader2, Search } from 'lucide-react';
import Modal from '../../../../shared/components/ui/Modal';
import { Button } from '../../../../shared/components/ui/Button';
import { ApiError } from '../../../../shared/api/api-error';
import type { Category } from '../../../../shared/types/library';
import {
  lookupBookByIsbn,
  registerManagedBook,
} from '../services/book-management.service';
import type { RegisteredBookDto } from '../types/book-management';
import {
  registerBookSchema,
  type RegisterBookFormData,
  type RegisterBookFormInput,
} from '../schemas/book.schema';
import { BookCategoryField } from './BookCategoryField';
import { BookCopiesFields } from './BookCopiesFields';
import {
  mapBookRequestField,
  toRegisterBookRequest,
} from '../utils/book-form.mapper';

interface RegisterBookModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: (newBook: RegisteredBookDto) => void;
  categories: Category[];
  categoriesLoading: boolean;
  categoriesError: string | null;
  onRetryCategories: () => void;
  onCategoryCreated: (category: Category) => void;
}

function normalizeIsbn(isbn: string): string {
  return isbn.replace(/[\s-]/g, '').toUpperCase();
}

function getErrorMessage(error: unknown): string {
  return error instanceof Error
    ? error.message
    : 'Não foi possível consultar este ISBN.';
}

function toFormDate(year: number | null): string {
  return year ? `01/01/${year}` : '';
}

const registrationSteps = [
  { id: 1, label: 'ISBN', description: 'Busque os dados da obra' },
  {
    id: 2,
    label: 'Dados do livro',
    description: 'Revise e complete os dados',
  },
  {
    id: 3,
    label: 'Exemplares',
    description: 'Informe tombo e localização',
  },
] as const;

export default function RegisterBookModal({
  open,
  onClose,
  onSuccess,
  categories,
  categoriesLoading,
  categoriesError,
  onRetryCategories,
  onCategoryCreated,
}: RegisterBookModalProps) {
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3>(1);
  const [authorInput, setAuthorInput] = useState('');
  const [authorError, setAuthorError] = useState('');
  const [isSearchingIsbn, setIsSearchingIsbn] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [blockedAccessionNumbers, setBlockedAccessionNumbers] = useState<
    string[]
  >([]);
  const [suggestedCategory, setSuggestedCategory] = useState('');
  const [isbnNotice, setIsbnNotice] = useState<{
    type: 'warning' | 'existing';
    message: string;
  } | null>(null);

  const methods = useForm<RegisterBookFormInput, unknown, RegisterBookFormData>(
    {
      resolver: zodResolver(registerBookSchema),
      defaultValues: {
        isbn: '',
        title: '',
        authors: [],
        categoryId: 0,
        publisher: '',
        publicationPlace: '',
        edition: '1ª',
        publicationDate: '',
        pageCount: undefined,
        coverImageUrl: '',
        summary: '',
        copies: [{ accessionNumber: '', physicalLocation: '' }],
      },
    },
  );

  const {
    register,
    handleSubmit,
    setValue,
    control,
    reset,
    setError,
    clearErrors,
    trigger,
    formState: { errors },
  } = methods;

  const authorsList = useWatch({ control, name: 'authors' }) ?? [];
  const isbnValue = useWatch({ control, name: 'isbn' }) ?? '';
  const selectedCategoryId = useWatch({ control, name: 'categoryId' }) ?? 0;

  const handleDateMask = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/\D/g, '');
    if (value.length > 8) value = value.slice(0, 8);
    if (value.length > 4) {
      value = `${value.slice(0, 2)}/${value.slice(2, 4)}/${value.slice(4)}`;
    } else if (value.length > 2) {
      value = `${value.slice(0, 2)}/${value.slice(2)}`;
    }
    setValue('publicationDate', value, { shouldValidate: true });
  };

  const handleResetModal = () => {
    reset();
    setCurrentStep(1);
    setAuthorInput('');
    setAuthorError('');
    setIsbnNotice(null);
    setSuggestedCategory('');
    setBlockedAccessionNumbers([]);
    setIsSaving(false);
    onClose();
  };

  const handleNextFromStep1 = async () => {
    const isIsbnValid = await trigger('isbn');
    if (!isIsbnValid) return;

    clearErrors('isbn');
    setIsSearchingIsbn(true);
    setIsbnNotice(null);
    const cleanedIsbn = normalizeIsbn(isbnValue);
    setValue('isbn', cleanedIsbn);

    try {
      const book = await lookupBookByIsbn(cleanedIsbn);
      if (book) {
        setValue('title', book.title);
        setValue('authors', book.authors);
        setValue('publisher', book.publisher ?? '');
        setValue('publicationPlace', book.place ?? '');
        setValue('edition', book.edition ?? '');
        setValue('publicationDate', toFormDate(book.publicationYear));
        if (book.pageCount !== null) setValue('pageCount', book.pageCount);
        setValue('coverImageUrl', book.coverUrl ?? '');
        setValue('summary', book.description ?? '');
        setSuggestedCategory(book.categorySuggestions.join(', '));
      } else {
        setIsbnNotice({
          type: 'warning',
          message:
            'ISBN não encontrado. Você pode continuar e preencher os dados manualmente.',
        });
      }
      setCurrentStep(2);
    } catch (error) {
      if (error instanceof ApiError && error.status === 409) {
        setError('isbn', { type: 'server', message: error.message });
        setIsbnNotice({
          type: 'existing',
          message: error.message,
        });
      } else {
        setIsbnNotice({
          type: 'warning',
          message: `${getErrorMessage(error)} Você pode continuar e preencher os dados manualmente.`,
        });
        setCurrentStep(2);
      }
    } finally {
      setIsSearchingIsbn(false);
    }
  };

  const handleContinueManually = async () => {
    if (!(await trigger('isbn'))) return;
    setValue('isbn', normalizeIsbn(isbnValue));
    setIsbnNotice({
      type: 'warning',
      message: 'Preencha manualmente os dados do livro.',
    });
    setCurrentStep(2);
  };

  const handleNextFromStep2 = async () => {
    const isValid = await trigger([
      'title',
      'authors',
      'categoryId',
      'publisher',
      'publicationPlace',
      'edition',
      'publicationDate',
      'pageCount',
    ]);
    if (isValid) {
      setCurrentStep(3);
    }
  };

  const handleAddAuthor = () => {
    if (!authorInput.trim()) {
      setAuthorError('Digite o nome do autor antes de adicionar.');
      return;
    }
    if (
      authorsList.some(
        (author) =>
          author.toLocaleLowerCase() === authorInput.trim().toLocaleLowerCase(),
      )
    ) {
      setAuthorError('Este autor já foi adicionado.');
      return;
    }
    setValue('authors', [...authorsList, authorInput.trim()], {
      shouldValidate: true,
    });
    setAuthorInput('');
    setAuthorError('');
    clearErrors('authors');
  };

  const handleRemoveAuthor = (indexToRemove: number) => {
    const updated = authorsList.filter((_, idx) => idx !== indexToRemove);
    setValue('authors', updated, { shouldValidate: true });
  };

  const onSubmit = async (data: RegisterBookFormData) => {
    setIsSaving(true);
    clearErrors();
    setBlockedAccessionNumbers([]);
    try {
      const newBook = await registerManagedBook(toRegisterBookRequest(data));
      onSuccess(newBook);
      handleResetModal();
    } catch (error) {
      if (error instanceof ApiError && error.status === 400) {
        const unmappedErrors: string[] = [];
        const messagesByField = new Map<string, string[]>();
        error.errors.forEach(({ field, message }) => {
          messagesByField.set(field, [
            ...(messagesByField.get(field) ?? []),
            message,
          ]);
        });
        messagesByField.forEach((messages, field) => {
          const formField = mapBookRequestField(field);
          if (formField) {
            setError(formField, {
              type: 'server',
              message: messages.join(' '),
            });
          } else {
            unmappedErrors.push(...messages);
          }
        });
        if (unmappedErrors.length > 0) {
          setError('root.server', {
            type: 'server',
            message: unmappedErrors.join(' '),
          });
        } else if (error.errors.length === 0) {
          setError('root.server', {
            type: 'server',
            message: error.message,
          });
        }
      } else if (error instanceof ApiError && error.status === 409) {
        if (error.bookId !== undefined || /isbn/i.test(error.message)) {
          setCurrentStep(1);
          setError('isbn', { type: 'server', message: error.message });
        }
        if (error.accessionNumbers.length > 0) {
          setCurrentStep(3);
          setBlockedAccessionNumbers(error.accessionNumbers);
          error.accessionNumbers.forEach((accessionNumber) => {
            const index = data.copies.findIndex(
              (copy) => copy.accessionNumber.trim() === accessionNumber.trim(),
            );
            if (index >= 0) {
              setError(`copies.${index}.accessionNumber`, {
                type: 'server',
                message: 'Este tombo já está cadastrado.',
              });
            }
          });
          setError('root.server', {
            type: 'server',
            message: error.message,
          });
        } else if (error.bookId === undefined) {
          setError('root.server', {
            type: 'server',
            message: error.message,
          });
        }
      } else {
        setError('root.server', {
          type: 'server',
          message: getErrorMessage(error),
        });
      }
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Modal
      isOpen={open}
      onClose={handleResetModal}
      title="Cadastrar livro"
      size="full"
      header={
        <ol
          aria-label="Etapas do cadastro"
          className="mb-4 grid grid-cols-3 gap-3 border-b border-line pb-4"
        >
          {registrationSteps.map((step) => {
            const isCurrent = currentStep === step.id;
            const isComplete = currentStep > step.id;
            return (
              <li
                key={step.id}
                aria-current={isCurrent ? 'step' : undefined}
                className={`min-w-0 ${isCurrent ? 'text-primary' : 'text-muted'}`}
              >
                <div className="flex items-center gap-2">
                  <span
                    className={`flex size-8 shrink-0 items-center justify-center rounded-full text-sm font-bold ${
                      isCurrent
                        ? 'bg-primary text-on-primary'
                        : isComplete
                          ? 'bg-ok-bg text-ok'
                          : 'bg-chip text-fg'
                    }`}
                  >
                    {isComplete ? (
                      <Check size={16} aria-hidden="true" />
                    ) : (
                      step.id
                    )}
                  </span>
                  <span className="min-w-0">
                    <span className="block truncate text-xs font-bold sm:text-sm">
                      {step.label}
                    </span>
                    <span className="hidden text-xs text-muted md:block">
                      {step.description}
                    </span>
                  </span>
                </div>
                <span
                  aria-hidden="true"
                  className={`mt-3 block h-1 rounded-full ${
                    isCurrent || isComplete ? 'bg-primary' : 'bg-line'
                  }`}
                />
              </li>
            );
          })}
        </ol>
      }
      footer={
        <div className="flex w-full items-center justify-between gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              if (currentStep === 1) {
                handleResetModal();
              } else {
                setCurrentStep((step) => (step === 3 ? 2 : 1));
              }
            }}
          >
            {currentStep === 1 ? 'Cancelar' : 'Voltar'}
          </Button>

          {currentStep === 1 && (
            <Button
              type="button"
              variant="outline"
              onClick={handleContinueManually}
            >
              Preencher manualmente
            </Button>
          )}

          {currentStep === 2 && (
            <Button
              type="button"
              onClick={handleNextFromStep2}
              disabled={
                categoriesLoading ||
                Boolean(categoriesError) ||
                categories.length === 0
              }
            >
              Continuar
            </Button>
          )}

          {currentStep === 3 && (
            <Button
              type="submit"
              form="register-book-form"
              disabled={isSaving}
              leftIcon={
                isSaving ? <Loader2 size={14} className="animate-spin" /> : null
              }
            >
              Salvar livro
            </Button>
          )}
        </div>
      }
    >
      <FormProvider {...methods}>
        <form
          onSubmit={handleSubmit(onSubmit)}
          id="register-book-form"
          className="mx-auto w-full max-w-3xl space-y-4"
        >
          {errors.root?.server && (
            <div
              className="mb-4 flex items-center gap-2 rounded-lg border border-danger-line bg-danger-bg p-3 text-xs text-danger"
              role="alert"
            >
              <AlertCircle size={16} className="shrink-0" />
              <div>
                <p>{errors.root.server.message}</p>
                {blockedAccessionNumbers.length > 0 && (
                  <p className="mt-1">
                    Tombos em conflito: {blockedAccessionNumbers.join(', ')}
                  </p>
                )}
              </div>
            </div>
          )}
          {currentStep === 1 && (
            <div className="flex flex-col gap-5 rounded-xl border border-line p-4 sm:p-6">
              <div>
                <h3 className="type-label text-fg">
                  Encontre a obra pelo ISBN
                </h3>
                <p className="type-caption mt-1 text-muted">
                  A busca consulta a API e preenche os dados disponíveis para
                  você revisar.
                </p>
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold text-fg">
                  ISBN (10 ou 13 dígitos) *
                </label>
                <div className="flex flex-col  gap-2 justify-between sm:flex-row">
                  <input
                    {...register('isbn')}
                    type="text"
                    placeholder="ex: 9786500000001"
                    className={`rounded-lg border bg-surface px-3 py-2 text-sm text-fg focus:outline-none ${
                      errors.isbn
                        ? 'border-danger bg-danger-bg'
                        : 'border-line focus:border-primary'
                    }`}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleNextFromStep1}
                    disabled={isSearchingIsbn}
                    leftIcon={
                      isSearchingIsbn ? (
                        <Loader2 size={14} className="animate-spin" />
                      ) : (
                        <Search size={14} />
                      )
                    }
                  >
                    Buscar ISBN
                  </Button>
                </div>
                {errors.isbn && (
                  <span className="mt-1.5 block text-xs font-medium text-danger">
                    {errors.isbn.message}
                  </span>
                )}
              </div>

              {isbnNotice && (
                <div
                  role={isbnNotice.type === 'existing' ? 'alert' : 'status'}
                  className="flex flex-col items-start justify-between gap-3 rounded-lg border border-warn-line bg-warn-bg p-3 text-xs text-warn sm:flex-row sm:items-center"
                >
                  <div className="flex items-center gap-2">
                    <AlertCircle size={16} className="text-warn shrink-0" />
                    <span>{isbnNotice.message}</span>
                  </div>
                </div>
              )}
            </div>
          )}

          {currentStep === 2 && (
            <div className="flex flex-col gap-5 rounded-xl border border-line p-4 sm:p-6">
              <div>
                <h3 className="type-label text-fg">Dados bibliográficos</h3>
                <p className="type-caption mt-1 text-muted">
                  Revise os dados encontrados e complete as informações
                  obrigatórias.
                </p>
              </div>
              {isbnNotice && isbnNotice.type === 'warning' && (
                <div className="rounded-lg bg-info-bg p-3 border border-info-line text-xs text-info flex items-center gap-2">
                  <AlertCircle size={16} className="text-info shrink-0" />
                  <span>{isbnNotice.message}</span>
                </div>
              )}
              {suggestedCategory && (
                <p className="text-xs text-muted">
                  Categoria sugerida pela consulta:{' '}
                  <strong>{suggestedCategory}</strong>. Escolha a categoria
                  correspondente do Libee abaixo.
                </p>
              )}

              <div>
                <label className="mb-1 block text-xs font-semibold text-fg">
                  ISBN
                </label>
                <input
                  {...register('isbn')}
                  type="text"
                  className="w-full rounded-lg border border-line bg-surface-warm px-3 py-2 text-sm text-fg"
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold text-fg">
                  Título *
                </label>
                <input
                  {...register('title')}
                  type="text"
                  placeholder="Título da obra"
                  className={`w-full rounded-lg border bg-surface px-3 py-2 text-sm text-fg focus:outline-none ${
                    errors.title
                      ? 'border-danger bg-danger-bg'
                      : 'border-line focus:border-primary'
                  }`}
                />
                {errors.title && (
                  <span className="mt-1.5 block text-xs font-medium text-danger">
                    {errors.title.message}
                  </span>
                )}
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold text-fg">
                  Autores
                </label>
                <div className="flex flex-wrap gap-1.5 mb-2">
                  {authorsList.map((author, index) => (
                    <span
                      key={index}
                      className="inline-flex items-center gap-1 rounded-md bg-chip px-2.5 py-1 text-xs font-medium text-fg"
                    >
                      {author}
                      <button
                        type="button"
                        onClick={() => handleRemoveAuthor(index)}
                        className="text-muted hover:text-danger"
                      >
                        ✕
                      </button>
                    </span>
                  ))}
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={authorInput}
                    onChange={(e) => setAuthorInput(e.target.value)}
                    placeholder="Nome do autor"
                    className="w-full rounded-lg border border-line bg-surface px-3 py-2 text-sm text-fg focus:outline-none focus:border-primary"
                  />
                  <Button variant="outline" onClick={handleAddAuthor}>
                    Adicionar
                  </Button>
                </div>
                {authorError && (
                  <span className="mt-1 block text-xs text-danger">
                    {authorError}
                  </span>
                )}
              </div>

              <BookCategoryField
                categories={categories}
                selectedCategoryId={selectedCategoryId}
                error={errors.categoryId?.message}
                isLoading={categoriesLoading}
                loadError={categoriesError}
                onRetry={onRetryCategories}
                onChange={(categoryId) =>
                  setValue('categoryId', categoryId, { shouldValidate: true })
                }
                onCategoryCreated={onCategoryCreated}
              />

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1 block text-xs font-semibold text-fg">
                    Editora
                  </label>
                  <input
                    {...register('publisher')}
                    type="text"
                    placeholder="Editora"
                    className={`w-full rounded-lg border bg-surface px-3 py-2 text-sm text-fg focus:outline-none ${
                      errors.publisher
                        ? 'border-danger bg-danger-bg'
                        : 'border-line focus:border-primary'
                    }`}
                  />
                  {errors.publisher && (
                    <span className="mt-1.5 block text-xs font-medium text-danger">
                      {errors.publisher.message}
                    </span>
                  )}
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold text-fg">
                    Local
                  </label>
                  <input
                    {...register('publicationPlace')}
                    type="text"
                    placeholder="Local de publicação"
                    className={`w-full rounded-lg border bg-surface px-3 py-2 text-sm text-fg focus:outline-none ${
                      errors.publicationPlace
                        ? 'border-danger bg-danger-bg'
                        : 'border-line focus:border-primary'
                    }`}
                  />
                  {errors.publicationPlace && (
                    <span className="mt-1.5 block text-xs font-medium text-danger">
                      {errors.publicationPlace.message}
                    </span>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1 block text-xs font-semibold text-fg">
                    Edição
                  </label>
                  <input
                    {...register('edition')}
                    type="text"
                    placeholder="ex: 1ª"
                    className={`w-full rounded-lg border bg-surface px-3 py-2 text-sm text-fg focus:outline-none ${
                      errors.edition
                        ? 'border-danger bg-danger-bg'
                        : 'border-line focus:border-primary'
                    }`}
                  />
                  {errors.edition && (
                    <span className="mt-1.5 block text-xs font-medium text-danger">
                      {errors.edition.message}
                    </span>
                  )}
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold text-fg">
                    Publicação
                  </label>
                  <input
                    {...register('publicationDate')}
                    type="text"
                    maxLength={10}
                    onChange={handleDateMask}
                    placeholder="DD/MM/AAAA"
                    className={`w-full rounded-lg border bg-surface px-3 py-2 text-sm text-fg focus:outline-none ${
                      errors.publicationDate
                        ? 'border-danger bg-danger-bg'
                        : 'border-line focus:border-primary'
                    }`}
                  />
                  {errors.publicationDate && (
                    <span className="mt-1.5 block text-xs font-medium text-danger">
                      {errors.publicationDate.message}
                    </span>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1 block text-xs font-semibold text-fg">
                    Páginas
                  </label>
                  <input
                    {...register('pageCount')}
                    type="number"
                    placeholder="300"
                    className={`w-full rounded-lg border bg-surface px-3 py-2 text-sm text-fg focus:outline-none ${
                      errors.pageCount
                        ? 'border-danger bg-danger-bg'
                        : 'border-line focus:border-primary'
                    }`}
                  />
                  {errors.pageCount && (
                    <span className="mt-1.5 block text-xs font-medium text-danger">
                      {errors.pageCount.message}
                    </span>
                  )}
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold text-fg">
                    URL da capa
                  </label>
                  <input
                    {...register('coverImageUrl')}
                    type="text"
                    placeholder="https://imagem-capa"
                    className="w-full rounded-lg border border-line bg-surface px-3 py-2 text-sm text-fg"
                  />
                </div>
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold text-fg">
                  Resumo (Opcional)
                </label>
                <textarea
                  {...register('summary')}
                  rows={3}
                  placeholder="Resumo da obra..."
                  className="w-full rounded-lg border border-line bg-surface px-3 py-2 text-sm text-fg"
                />
              </div>
            </div>
          )}

          {currentStep === 3 && (
            <div className="rounded-xl border border-line p-4 sm:p-6">
              <p className="type-caption mb-4 text-muted">
                Cada exemplar precisa de um tombo único e de uma localização
                física.
              </p>
              <BookCopiesFields />
            </div>
          )}
        </form>
      </FormProvider>
    </Modal>
  );
}
