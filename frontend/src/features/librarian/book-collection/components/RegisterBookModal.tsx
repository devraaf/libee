import { useEffect, useState } from 'react';
import { useForm, useFieldArray, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Plus, Trash2, AlertCircle, Loader2, Search } from 'lucide-react';
import Modal from '../../../../shared/components/ui/Modal';
import { Button } from '../../../../shared/components/ui/Button';
import {
  listBooks,
  listCopies,
  registerBookWithCopies,
  type RegisteredBook,
} from '../../../catalog/services/books.service';
import { listCategories } from '../../../catalog/services/catalog.service';
import { lookupBookByIsbn } from '../../../catalog/services/isbn-lookup.service';
import { MockServiceError } from '../../../../shared/mocks/service-utils';
import type { Category } from '../../../../shared/types/library';
import {
  registerBookSchema,
  type RegisterBookFormData,
  type RegisterBookFormInput,
} from '../schemas/book.schema';

interface RegisterBookModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: (newBook: RegisteredBook) => void;
  onOpenEditModal?: (bookId: number) => void;
}

function normalizeIsbn(isbn: string): string {
  return isbn.replace(/[\s-]/g, '').toUpperCase();
}

function toFormDate(date: string | null): string {
  if (!date) return '';
  const parsed = new Date(`${date}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) return '';
  return new Intl.DateTimeFormat('pt-BR').format(parsed);
}

function toServiceDate(date: string | null): string | null {
  if (!date) return null;
  const [day, month, year] = date.split('/');
  return `${year}-${month}-${day}`;
}

export default function RegisterBookModal({
  open,
  onClose,
  onSuccess,
  onOpenEditModal,
}: RegisterBookModalProps) {
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3>(1);
  const [authorInput, setAuthorInput] = useState('');
  const [authorError, setAuthorError] = useState('');
  const [isSearchingIsbn, setIsSearchingIsbn] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [categoriesLoading, setCategoriesLoading] = useState(false);
  const [categoriesError, setCategoriesError] = useState<string | null>(null);
  const [categoriesRetry, setCategoriesRetry] = useState(0);
  const [suggestedCategory, setSuggestedCategory] = useState('');
  const [isbnNotice, setIsbnNotice] = useState<{
    type: 'warning' | 'existing';
    message: string;
  } | null>(null);
  const [existingBookId, setExistingBookId] = useState<number | null>(null);

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
  } = useForm<RegisterBookFormInput, unknown, RegisterBookFormData>({
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
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'copies',
  });

  const authorsList = useWatch({ control, name: 'authors' }) ?? [];
  const isbnValue = useWatch({ control, name: 'isbn' }) ?? '';

  useEffect(() => {
    if (!open) return;
    let active = true;

    async function loadCategories() {
      setCategoriesError(null);
      setCategoriesLoading(true);
      try {
        const result = await listCategories();
        if (active) setCategories(result);
      } catch (error) {
        if (active) {
          setCategoriesError(
            error instanceof Error
              ? error.message
              : 'Não foi possível carregar as categorias.',
          );
        }
      } finally {
        if (active) setCategoriesLoading(false);
      }
    }

    void loadCategories();
    return () => {
      active = false;
    };
  }, [open, categoriesRetry]);

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
    setExistingBookId(null);
    setCategoriesError(null);
    setIsSaving(false);
    onClose();
  };

  const handleNextFromStep1 = async () => {
    const isIsbnValid = await trigger('isbn');
    if (!isIsbnValid) return;

    setIsSearchingIsbn(true);
    setIsbnNotice(null);
    const cleanedIsbn = normalizeIsbn(isbnValue);
    setValue('isbn', cleanedIsbn);
    let existingBooks: Awaited<ReturnType<typeof listBooks>>['items'] = [];

    try {
      const result = await listBooks({ page: 1, size: 1000 });
      existingBooks = result.items;
      const existingBook = existingBooks.find(
        (book) => normalizeIsbn(book.isbn) === cleanedIsbn,
      );
      if (existingBook) {
        setExistingBookId(existingBook.id);
        setIsbnNotice({
          type: 'existing',
          message: `Este ISBN já está cadastrado para a obra "${existingBook.title}".`,
        });
        return;
      }

      const book = await lookupBookByIsbn(cleanedIsbn);
      if (book) {
        setValue('title', book.title);
        setValue(
          'authors',
          book.authors.map(({ name }) => name),
        );
        setValue('publisher', book.publisher ?? '');
        setValue('publicationPlace', book.publicationPlace ?? '');
        setValue('edition', book.edition ?? '');
        setValue('publicationDate', toFormDate(book.publicationDate));
        if (book.pageCount !== null) setValue('pageCount', book.pageCount);
        setValue('coverImageUrl', book.coverImageUrl ?? '');
        setValue('summary', book.summary ?? '');
        setSuggestedCategory(book.category.name);
      } else {
        setIsbnNotice({
          type: 'warning',
          message:
            'ISBN não encontrado. Você pode continuar e preencher os dados manualmente.',
        });
      }
      setCurrentStep(2);
    } catch (error) {
      if (
        error instanceof MockServiceError &&
        error.code === 'ISBN_ALREADY_REGISTERED'
      ) {
        const existingBook = existingBooks.find(
          (book) => normalizeIsbn(book.isbn) === cleanedIsbn,
        );
        setExistingBookId(existingBook?.id ?? null);
        setIsbnNotice({
          type: 'existing',
          message: existingBook
            ? `Este ISBN já está cadastrado para a obra "${existingBook.title}".`
            : 'Este ISBN já está cadastrado.',
        });
      } else if (
        error instanceof MockServiceError &&
        error.code === 'SERVICE_UNAVAILABLE'
      ) {
        setIsbnNotice({
          type: 'warning',
          message:
            'O serviço de consulta está indisponível. Você pode continuar e preencher os dados manualmente.',
        });
        setCurrentStep(2);
      } else {
        setIsbnNotice({
          type: 'warning',
          message: `${
            error instanceof Error
              ? error.message
              : 'Não foi possível consultar este ISBN.'
          } Você pode continuar e preencher os dados manualmente.`,
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
    clearErrors('copies');
    try {
      const existingCopies = await listCopies();
      const normalizedExistingNumbers = new Set(
        existingCopies.map((copy) =>
          copy.accessionNumber.trim().toLocaleLowerCase(),
        ),
      );
      let hasAccessionError = false;

      data.copies.forEach((copy, index) => {
        if (
          normalizedExistingNumbers.has(
            copy.accessionNumber.trim().toLocaleLowerCase(),
          )
        ) {
          setError(`copies.${index}.accessionNumber`, {
            type: 'manual',
            message: 'Tombo já pertence a outro exemplar.',
          });
          hasAccessionError = true;
        }
      });
      if (hasAccessionError) return;

      const newBook = await registerBookWithCopies({
        ...data,
        isbn: normalizeIsbn(data.isbn),
        publicationDate: toServiceDate(data.publicationDate),
      });
      onSuccess(newBook);
      handleResetModal();
    } catch (error) {
      if (error instanceof MockServiceError) {
        if (error.code === 'ISBN_ALREADY_REGISTERED') {
          setError('isbn', { type: 'manual', message: error.message });
          setCurrentStep(1);
        } else if (error.code === 'CONFLICT') {
          setError('copies.0.accessionNumber', {
            type: 'manual',
            message: error.message,
          });
          setCurrentStep(3);
        } else {
          setError('root.server', { type: 'server', message: error.message });
        }
      } else {
        setError('root.server', {
          type: 'server',
          message:
            error instanceof Error
              ? error.message
              : 'Não foi possível cadastrar o livro.',
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
        <div className="mb-4 flex flex-wrap items-center gap-4 border-b border-line pb-4 text-xs font-semibold sm:gap-6">
          <div
            className={`flex items-center gap-2 ${currentStep === 1 ? 'text-primary' : 'text-muted'}`}
          >
            <span
              className={`flex h-6 w-6 items-center justify-center rounded-full ${currentStep === 1 ? 'bg-primary text-on-primary' : 'bg-chip text-fg'}`}
            >
              1
            </span>
            ISBN
          </div>
          <div
            className={`flex items-center gap-2 ${currentStep === 2 ? 'text-primary' : 'text-muted'}`}
          >
            <span
              className={`flex h-6 w-6 items-center justify-center rounded-full ${currentStep === 2 ? 'bg-primary text-on-primary' : 'bg-chip text-fg'}`}
            >
              2
            </span>
            Dados do livro
          </div>
          <div
            className={`flex items-center gap-2 ${currentStep === 3 ? 'text-primary' : 'text-muted'}`}
          >
            <span
              className={`flex h-6 w-6 items-center justify-center rounded-full ${currentStep === 3 ? 'bg-primary text-on-primary' : 'bg-chip text-fg'}`}
            >
              3
            </span>
            Exemplares
          </div>
        </div>
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
      <form onSubmit={handleSubmit(onSubmit)} id="register-book-form">
        {errors.root?.server && (
          <div
            className="mb-4 flex items-center gap-2 rounded-lg border border-danger-line bg-danger-bg p-3 text-xs text-danger"
            role="alert"
          >
            <AlertCircle size={16} className="shrink-0" />
            <span>{errors.root.server.message}</span>
          </div>
        )}
        {currentStep === 1 && (
          <div className="flex flex-col gap-4">
            <div>
              <label className="mb-1 block text-xs font-semibold text-fg">
                ISBN (10 ou 13 dígitos) *
              </label>
              <div className="flex flex-col gap-2 sm:flex-row">
                <input
                  {...register('isbn')}
                  type="text"
                  placeholder="ex: 9786500000001"
                  className={`w-full rounded-lg border bg-surface px-3 py-2 text-sm text-fg focus:outline-none ${
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
              <div className="flex flex-col items-start justify-between gap-3 rounded-lg border border-warn-line bg-warn-bg p-3 text-xs text-warn sm:flex-row sm:items-center">
                <div className="flex items-center gap-2">
                  <AlertCircle size={16} className="text-warn shrink-0" />
                  <span>{isbnNotice.message}</span>
                </div>
                {isbnNotice.type === 'existing' &&
                  existingBookId !== null &&
                  onOpenEditModal && (
                    <Button
                      type="button"
                      size="sm"
                      onClick={() => {
                        onClose();
                        onOpenEditModal(existingBookId);
                      }}
                    >
                      Abrir edição
                    </Button>
                  )}
              </div>
            )}
          </div>
        )}

        {currentStep === 2 && (
          <div className="flex flex-col gap-4">
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
                <button
                  type="button"
                  onClick={handleAddAuthor}
                  className="rounded-lg border border-primary px-4 py-2 text-sm font-medium text-primary hover:bg-surface-hover"
                >
                  Adicionar
                </button>
              </div>
              {authorError && (
                <span className="mt-1 block text-xs text-danger">
                  {authorError}
                </span>
              )}
            </div>

            <div>
              <label className="mb-1 block text-xs font-semibold text-fg">
                Categoria *
              </label>
              <select
                {...register('categoryId', { valueAsNumber: true })}
                disabled={
                  categoriesLoading ||
                  categories.length === 0 ||
                  Boolean(categoriesError)
                }
                className={`w-full rounded-lg border bg-surface px-3 py-2 text-sm text-fg focus:outline-none ${
                  errors.categoryId
                    ? 'border-danger bg-danger-bg'
                    : 'border-line focus:border-primary'
                }`}
              >
                <option value={0}>Selecione uma categoria...</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
              {categoriesLoading && (
                <span className="mt-1 block text-xs text-muted">
                  Carregando categorias...
                </span>
              )}
              {categoriesError && (
                <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
                  <span
                    className="text-xs font-medium text-danger"
                    role="alert"
                  >
                    {categoriesError}
                  </span>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => setCategoriesRetry((retry) => retry + 1)}
                  >
                    Tentar novamente
                  </Button>
                </div>
              )}
              {errors.categoryId && (
                <span className="mt-1.5 block text-xs font-medium text-danger">
                  {errors.categoryId.message}
                </span>
              )}
            </div>

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
                  URL da capa (Opcional)
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
          <div className="flex flex-col gap-4">
            <div className="flex justify-between items-center">
              <h3 className="text-sm font-bold text-fg">Exemplares da obra</h3>
              <button
                type="button"
                onClick={() =>
                  append({ accessionNumber: '', physicalLocation: '' })
                }
                className="text-xs font-semibold text-primary hover:text-primary-hover flex items-center gap-1"
              >
                <Plus size={14} /> Adicionar exemplar
              </button>
            </div>

            {fields.length === 0 && (
              <p className="text-xs text-muted">
                Nenhum exemplar adicionado. Você pode concluir o cadastro sem
                exemplares.
              </p>
            )}

            {fields.map((field, index) => (
              <div
                key={field.id}
                className="p-3 rounded-lg border border-line bg-surface-warm flex flex-col gap-3 relative"
              >
                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold text-fg">
                    Exemplar {index + 1}
                  </span>
                  <button
                    type="button"
                    onClick={() => remove(index)}
                    aria-label={`Remover exemplar ${index + 1}`}
                    className="text-danger hover:text-danger"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="mb-1 block text-xs font-semibold text-fg">
                      Tombo (Nº de Registro) *
                    </label>
                    <input
                      {...register(`copies.${index}.accessionNumber`)}
                      type="text"
                      placeholder="ex: 0090"
                      className={`w-full rounded-lg border bg-surface px-3 py-2 text-sm text-fg focus:outline-none ${
                        errors.copies?.[index]?.accessionNumber
                          ? 'border-danger bg-danger-bg'
                          : 'border-line focus:border-primary'
                      }`}
                    />
                    {errors.copies?.[index]?.accessionNumber && (
                      <span className="mt-1.5 block text-xs font-medium text-danger">
                        {errors.copies[index]?.accessionNumber?.message}
                      </span>
                    )}
                  </div>

                  <div>
                    <label className="mb-1 block text-xs font-semibold text-fg">
                      Localização Física
                    </label>
                    <input
                      {...register(`copies.${index}.physicalLocation`)}
                      type="text"
                      placeholder="ex: Estante A-01"
                      className={`w-full rounded-lg border bg-surface px-3 py-2 text-sm text-fg focus:outline-none ${
                        errors.copies?.[index]?.physicalLocation
                          ? 'border-danger bg-danger-bg'
                          : 'border-line focus:border-primary'
                      }`}
                    />
                    {errors.copies?.[index]?.physicalLocation && (
                      <span className="mt-1.5 block text-xs font-medium text-danger">
                        {errors.copies[index]?.physicalLocation?.message}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </form>
    </Modal>
  );
}
