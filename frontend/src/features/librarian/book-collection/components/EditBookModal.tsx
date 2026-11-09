import { useEffect, useState } from 'react';
import { useFieldArray, useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Plus, Trash2 } from 'lucide-react';
import { Button } from '../../../../shared/components/ui/Button';
import Modal from '../../../../shared/components/ui/Modal';
import {
  getBook,
  listCopies,
  updateBookWithCopies,
  type RegisteredBook,
} from '../../../reader/catalog/services/books.service';
import { listCategories } from '../../../reader/catalog/services/catalog.service';
import { MockServiceError } from '../../../../shared/mocks/service-utils';
import type { Category } from '../../../../shared/types/library';
import {
  registerBookSchema,
  type RegisterBookFormData,
  type RegisterBookFormInput,
} from '../schemas/book.schema';

interface EditBookModalProps {
  open: boolean;
  bookId: number | null;
  onClose: () => void;
  onSuccess: (updatedBook: RegisteredBook) => void;
}

function toFormDate(date: string | null): string {
  if (!date) return '';
  const parsed = new Date(`${date}T00:00:00`);
  return Number.isNaN(parsed.getTime())
    ? ''
    : new Intl.DateTimeFormat('pt-BR').format(parsed);
}

function toServiceDate(date: string | null): string | null {
  if (!date) return null;
  const [day, month, year] = date.split('/');
  return `${year}-${month}-${day}`;
}

export default function EditBookModal({
  open,
  bookId,
  onClose,
  onSuccess,
}: EditBookModalProps) {
  const [currentStep, setCurrentStep] = useState<1 | 2>(1);
  const [authorInput, setAuthorInput] = useState('');
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [loanedCopyIds, setLoanedCopyIds] = useState<Set<number>>(new Set());

  const {
    register,
    handleSubmit,
    control,
    reset,
    setValue,
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
      edition: '',
      publicationDate: '',
      pageCount: undefined,
      coverImageUrl: '',
      summary: '',
      copies: [],
    },
  });
  const { fields, append, remove } = useFieldArray({
    control,
    name: 'copies',
  });
  const authorsList = useWatch({ control, name: 'authors' }) ?? [];
  const copyValues = useWatch({ control, name: 'copies' });

  useEffect(() => {
    if (!open || bookId === null) return;
    const currentBookId = bookId;
    let active = true;

    async function loadBookForEditing() {
      setIsLoading(true);
      setLoadError(null);
      try {
        const [book, copies, nextCategories] = await Promise.all([
          getBook(currentBookId),
          listCopies(currentBookId),
          listCategories(),
        ]);
        if (!active) return;
        setCategories(nextCategories);
        setAuthorInput('');
        setLoanedCopyIds(
          new Set(
            copies
              .filter(({ status }) => status === 'ON_LOAN')
              .map(({ id }) => id),
          ),
        );
        reset({
          isbn: book.isbn,
          title: book.title,
          authors: book.authors.map(({ name }) => name),
          categoryId: book.category.id,
          publisher: book.publisher ?? '',
          publicationPlace: book.publicationPlace ?? '',
          edition: book.edition ?? '',
          publicationDate: toFormDate(book.publicationDate),
          pageCount: book.pageCount ?? undefined,
          coverImageUrl: book.coverImageUrl ?? '',
          summary: book.summary ?? '',
          copies: copies.map(
            ({ id: copyId, accessionNumber, physicalLocation }) => ({
              copyId,
              accessionNumber,
              physicalLocation: physicalLocation ?? '',
            }),
          ),
        });
        setCurrentStep(1);
      } catch (error) {
        if (active) {
          setLoadError(
            error instanceof Error
              ? error.message
              : 'Não foi possível carregar os dados do livro.',
          );
        }
      } finally {
        if (active) setIsLoading(false);
      }
    }

    void loadBookForEditing();
    return () => {
      active = false;
    };
  }, [bookId, open, reset]);

  const handleDateMask = (event: React.ChangeEvent<HTMLInputElement>) => {
    let value = event.target.value.replace(/\D/g, '').slice(0, 8);
    if (value.length > 4) {
      value = `${value.slice(0, 2)}/${value.slice(2, 4)}/${value.slice(4)}`;
    } else if (value.length > 2) {
      value = `${value.slice(0, 2)}/${value.slice(2)}`;
    }
    event.target.value = value;
  };

  const handleNext = async () => {
    const valid = await trigger([
      'isbn',
      'title',
      'authors',
      'categoryId',
      'publisher',
      'publicationPlace',
      'edition',
      'publicationDate',
      'pageCount',
    ]);
    if (valid) setCurrentStep(2);
  };

  const handleAddAuthor = () => {
    const author = authorInput.trim();
    if (
      !author ||
      authorsList.some(
        (existing) =>
          existing.toLocaleLowerCase() === author.toLocaleLowerCase(),
      )
    ) {
      return;
    }
    setValue('authors', [...authorsList, author], { shouldValidate: true });
    setAuthorInput('');
    clearErrors('authors');
  };

  const handleRemoveAuthor = (indexToRemove: number) => {
    setValue(
      'authors',
      authorsList.filter((_, index) => index !== indexToRemove),
      { shouldValidate: true },
    );
  };

  const onSubmit = async (data: RegisterBookFormData) => {
    if (currentStep !== 2 || bookId === null) return;
    setIsSaving(true);
    clearErrors('root.server');
    try {
      const updatedBook = await updateBookWithCopies(bookId, {
        ...data,
        isbn: data.isbn.replace(/[\s-]/g, '').toUpperCase(),
        publicationDate: toServiceDate(data.publicationDate),
      });
      onSuccess(updatedBook);
      onClose();
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : 'Não foi possível atualizar o livro.';
      if (
        error instanceof MockServiceError &&
        error.code === 'ISBN_ALREADY_REGISTERED'
      ) {
        setError('isbn', { type: 'manual', message });
        setCurrentStep(1);
      } else {
        setError('root.server', { type: 'server', message });
      }
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Modal
      isOpen={open}
      onClose={onClose}
      title="Editar livro"
      size="full"
      header={
        <div className="mb-4 flex items-center gap-6 border-b border-line pb-4 text-xs font-semibold">
          <span className={currentStep === 1 ? 'text-primary' : 'text-muted'}>
            1. Dados do livro
          </span>
          <span className={currentStep === 2 ? 'text-primary' : 'text-muted'}>
            2. Exemplares
          </span>
        </div>
      }
      footer={
        <div className="flex w-full justify-between gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              if (currentStep === 2) setCurrentStep(1);
              else onClose();
            }}
          >
            {currentStep === 1 ? 'Cancelar' : 'Voltar'}
          </Button>
          {currentStep === 1 ? (
            <Button
              type="button"
              onClick={(event) => {
                event.preventDefault();
                event.stopPropagation();
                void handleNext();
              }}
              disabled={isLoading || isSaving}
            >
              Continuar
            </Button>
          ) : (
            <Button
              type="submit"
              form="edit-book-form"
              disabled={isLoading || isSaving}
            >
              {isSaving ? 'Salvando...' : 'Salvar alterações'}
            </Button>
          )}
        </div>
      }
    >
      {loadError ? (
        <div className="flex flex-col gap-3" role="alert">
          <p className="type-small text-danger">{loadError}</p>
          <Button type="button" variant="outline" onClick={onClose}>
            Fechar
          </Button>
        </div>
      ) : isLoading ? (
        <p className="type-small text-muted" role="status">
          Carregando dados do livro...
        </p>
      ) : (
        <form
          id="edit-book-form"
          onSubmit={(event) => {
            event.preventDefault();
            if (currentStep === 2) void handleSubmit(onSubmit)(event);
          }}
          className="flex flex-col gap-4"
        >
          {errors.root?.server && (
            <p className="text-sm text-danger" role="alert">
              {errors.root.server.message}
            </p>
          )}
          {currentStep === 1 ? (
            <>
              <label className="flex flex-col gap-1 text-sm">
                ISBN *
                <input
                  {...register('isbn')}
                  className="rounded-lg border border-line p-2"
                />
                {errors.isbn && (
                  <span className="text-xs text-danger">
                    {errors.isbn.message}
                  </span>
                )}
              </label>
              <label className="flex flex-col gap-1 text-sm">
                Título *
                <input
                  {...register('title')}
                  className="rounded-lg border border-line p-2"
                />
                {errors.title && (
                  <span className="text-xs text-danger">
                    {errors.title.message}
                  </span>
                )}
              </label>
              <div className="flex flex-col gap-2 text-sm">
                <span>Autores</span>
                <div className="flex flex-wrap gap-2">
                  {authorsList.map((author, index) => (
                    <span
                      key={`${author}-${index}`}
                      className="inline-flex items-center gap-2 rounded-md bg-chip px-2.5 py-1 text-xs"
                    >
                      {author}
                      <button
                        type="button"
                        aria-label={`Remover autor ${author}`}
                        onClick={() => handleRemoveAuthor(index)}
                        className="text-muted hover:text-danger"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
                <div className="flex gap-2">
                  <input
                    value={authorInput}
                    onChange={(event) => setAuthorInput(event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter') {
                        event.preventDefault();
                        handleAddAuthor();
                      }
                    }}
                    className="min-w-0 flex-1 rounded-lg border border-line p-2"
                    aria-label="Nome do autor"
                  />
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={handleAddAuthor}
                  >
                    Adicionar
                  </Button>
                </div>
                {errors.authors && (
                  <span className="text-xs text-danger">
                    {errors.authors.message}
                  </span>
                )}
              </div>
              <label className="flex flex-col gap-1 text-sm">
                Categoria *
                <select
                  {...register('categoryId', { valueAsNumber: true })}
                  className="rounded-lg border border-line p-2"
                >
                  <option value={0}>Selecione uma categoria</option>
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
                {errors.categoryId && (
                  <span className="text-xs text-danger">
                    {errors.categoryId.message}
                  </span>
                )}
              </label>
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="flex flex-col gap-1 text-sm">
                  Editora
                  <input
                    {...register('publisher')}
                    className="rounded-lg border border-line p-2"
                  />
                  {errors.publisher && (
                    <span className="text-xs text-danger">
                      {errors.publisher.message}
                    </span>
                  )}
                </label>
                <label className="flex flex-col gap-1 text-sm">
                  Local
                  <input
                    {...register('publicationPlace')}
                    className="rounded-lg border border-line p-2"
                  />
                  {errors.publicationPlace && (
                    <span className="text-xs text-danger">
                      {errors.publicationPlace.message}
                    </span>
                  )}
                </label>
                <label className="flex flex-col gap-1 text-sm">
                  Edição
                  <input
                    {...register('edition')}
                    className="rounded-lg border border-line p-2"
                  />
                  {errors.edition && (
                    <span className="text-xs text-danger">
                      {errors.edition.message}
                    </span>
                  )}
                </label>
                <label className="flex flex-col gap-1 text-sm">
                  Publicação
                  <input
                    {...register('publicationDate')}
                    onChange={(event) => {
                      handleDateMask(event);
                      setValue('publicationDate', event.target.value, {
                        shouldValidate: true,
                      });
                    }}
                    placeholder="DD/MM/AAAA"
                    maxLength={10}
                    className="rounded-lg border border-line p-2"
                  />
                  {errors.publicationDate && (
                    <span className="text-xs text-danger">
                      {errors.publicationDate.message}
                    </span>
                  )}
                </label>
                <label className="flex flex-col gap-1 text-sm">
                  Número de páginas
                  <input
                    {...register('pageCount')}
                    type="number"
                    className="rounded-lg border border-line p-2"
                  />
                  {errors.pageCount && (
                    <span className="text-xs text-danger">
                      {errors.pageCount.message}
                    </span>
                  )}
                </label>
                <label className="flex flex-col gap-1 text-sm">
                  Capa
                  <input
                    {...register('coverImageUrl')}
                    className="rounded-lg border border-line p-2"
                  />
                </label>
              </div>
              <label className="flex flex-col gap-1 text-sm">
                Resumo
                <textarea
                  {...register('summary')}
                  rows={3}
                  className="rounded-lg border border-line p-2"
                />
              </label>
            </>
          ) : (
            <>
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold">Exemplares</h3>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  leftIcon={<Plus size={14} />}
                  onClick={() =>
                    append({ accessionNumber: '', physicalLocation: '' })
                  }
                >
                  Adicionar exemplar
                </Button>
              </div>
              {fields.length === 0 && (
                <p className="text-sm text-muted">
                  Nenhum exemplar cadastrado. Adicione um exemplar se
                  necessário.
                </p>
              )}
              {fields.map((field, index) => {
                const copyId = copyValues?.[index]?.copyId;
                const isOnLoan =
                  typeof copyId === 'number' && loanedCopyIds.has(copyId);
                return (
                  <div
                    key={field.id}
                    className="grid gap-3 rounded-lg border border-line p-3 sm:grid-cols-[1fr_1fr_auto]"
                  >
                    {typeof copyId === 'number' && (
                      <input
                        type="hidden"
                        {...register(`copies.${index}.copyId`, {
                          valueAsNumber: true,
                        })}
                      />
                    )}
                    <label className="flex flex-col gap-1 text-sm">
                      <span>
                        Tombo *{' '}
                        {isOnLoan && (
                          <span className="text-muted">(emprestado)</span>
                        )}
                      </span>
                      <input
                        {...register(`copies.${index}.accessionNumber`)}
                        readOnly={isOnLoan}
                        className="rounded-lg border border-line p-2"
                      />
                      {errors.copies?.[index]?.accessionNumber && (
                        <span className="text-xs text-danger">
                          {errors.copies[index]?.accessionNumber?.message}
                        </span>
                      )}
                    </label>
                    <label className="flex flex-col gap-1 text-sm">
                      Localização física
                      <input
                        {...register(`copies.${index}.physicalLocation`)}
                        readOnly={isOnLoan}
                        className="rounded-lg border border-line p-2"
                      />
                      {errors.copies?.[index]?.physicalLocation && (
                        <span className="text-xs text-danger">
                          {errors.copies[index]?.physicalLocation?.message}
                        </span>
                      )}
                    </label>
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      aria-label={`Remover exemplar ${index + 1}`}
                      onClick={() => remove(index)}
                      disabled={isOnLoan}
                    >
                      <Trash2 size={16} />
                    </Button>
                  </div>
                );
              })}
            </>
          )}
        </form>
      )}
    </Modal>
  );
}
