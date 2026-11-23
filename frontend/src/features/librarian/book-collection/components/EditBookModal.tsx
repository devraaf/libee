import { useEffect, useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { Check, Loader2 } from 'lucide-react';
import { getBookDetails } from '@/features/book-details/services/books.service';
import type { Category, Copy } from '@/shared/types/library';
import { ApiError } from '@/shared/api/api-error';
import { Button } from '@/shared/components/ui/Button';
import { EmptyState } from '@/shared/components/ui/EmptyState';
import Modal from '@/shared/components/ui/Modal';
import { LoadingState } from '../../shared/components/LoadingState';
import {
  addManagedCopy,
  deleteManagedCopy,
  updateManagedBook,
} from '../services/book-management.service';
import {
  bookFormSchema,
  type BookFormData,
  type BookFormInput,
} from '../schemas/book.schema';
import {
  mapBookRequestField,
  toUpdateBookRequest,
} from '../utils/book-form.mapper';
import { getErrorMessage } from '../../shared/utils/error-message';
import { EditBookForm } from './EditBookForm';

interface EditBookModalProps {
  open: boolean;
  bookId: number | null;
  categories: Category[];
  categoriesLoading: boolean;
  categoriesError: string | null;
  onClose: () => void;
  onRetryCategories: () => void;
  onCategoryCreated: (category: Category) => void;
  onCopyDeleted: () => void;
}

const editSteps = [
  { id: 1, label: 'Dados do livro', description: 'Revise os dados da obra' },
  { id: 2, label: 'Exemplares', description: 'Gerencie os exemplares' },
] as const;

const defaultValues: BookFormInput = {
  isbn: '',
  title: '',
  authors: [],
  categoryId: 0,
  publisher: '',
  publicationPlace: '',
  edition: '',
  publicationDate: '',
  pageCount: '',
  coverImageUrl: '',
  summary: '',
  copies: [],
};

function toFormYear(year: string | null): string {
  return year ?? '';
}

export default function EditBookModal({
  open,
  bookId,
  categories,
  categoriesLoading,
  categoriesError,
  onClose,
  onRetryCategories,
  onCategoryCreated,
  onCopyDeleted,
}: EditBookModalProps) {
  const [book, setBook] = useState<
    Awaited<ReturnType<typeof getBookDetails>>['book'] | null
  >(null);
  const [copies, setCopies] = useState<Copy[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [loadedBookId, setLoadedBookId] = useState<number | null>(null);
  const [currentStep, setCurrentStep] = useState<1 | 2>(1);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [blockedAccessionNumbers, setBlockedAccessionNumbers] = useState<
    string[]
  >([]);
  const [copyToDelete, setCopyToDelete] = useState<Copy | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [isDeletingCopy, setIsDeletingCopy] = useState(false);
  const [savedCopyFingerprints, setSavedCopyFingerprints] = useState<
    Set<string>
  >(() => new Set());

  const methods = useForm<BookFormInput, unknown, BookFormData>({
    resolver: zodResolver(bookFormSchema),
    defaultValues,
  });
  const { reset, setError, clearErrors, setValue, trigger, getValues } =
    methods;

  useEffect(() => {
    if (!open || bookId === null) return;
    let active = true;

    getBookDetails(bookId)
      .then(({ book: details, copies: bookCopies }) => {
        if (!active) return;
        setLoadError(null);
        setCurrentStep(1);
        setSaveError(null);
        setBlockedAccessionNumbers([]);
        setCopyToDelete(null);
        setDeleteError(null);
        setSavedCopyFingerprints(new Set());
        setBook(details);
        setCopies(bookCopies);
        reset({
          isbn: details.isbn,
          title: details.title,
          authors: details.authors,
          categoryId: details.category.id,
          publisher: details.publisher ?? '',
          publicationPlace: details.publicationPlace ?? '',
          edition: details.edition ?? '',
          publicationDate: toFormYear(details.publicationDate),
          pageCount: details.pageCount ?? '',
          coverImageUrl: details.coverImageUrl ?? '',
          summary: details.summary ?? '',
          copies: bookCopies.map((copy) => ({
            copyId: copy.id,
            accessionNumber: copy.accessionNumber,
            physicalLocation: copy.physicalLocation ?? '',
          })),
        });
        setLoadedBookId(bookId);
      })
      .catch((error: unknown) => {
        if (active) {
          setLoadError(
            getErrorMessage(
              error,
              'Não foi possível carregar os dados do livro.',
            ),
          );
          setLoadedBookId(bookId);
        }
      });

    return () => {
      active = false;
    };
  }, [bookId, open, reset]);

  const isLoadingBook = bookId !== null && loadedBookId !== bookId;
  const visibleLoadError = loadedBookId === bookId ? loadError : null;

  useEffect(() => {
    if (!book || loadedBookId !== bookId) return;
    const category = categories.find(
      (item) =>
        item.name.toLocaleLowerCase() ===
        book.category.name.toLocaleLowerCase(),
    );
    if (category && getValues('categoryId') === 0) {
      setValue('categoryId', category.id, { shouldValidate: false });
    }
  }, [book, bookId, categories, getValues, loadedBookId, setValue]);

  async function handleDeleteCopy(copyId: number): Promise<boolean> {
    if (!book) return false;
    const copy = copies.find((item) => item.id === copyId);
    if (!copy || copy.status === 'ON_LOAN') return false;

    setIsDeletingCopy(true);
    setDeleteError(null);
    setBlockedAccessionNumbers([]);
    try {
      await deleteManagedCopy(book.id, copy.id);
      setCopies((current) => current.filter((item) => item.id !== copy.id));
      setValue(
        'copies',
        getValues('copies').filter((item) => item.copyId !== copy.id),
      );
      setCopyToDelete(null);
      onCopyDeleted();
      return true;
    } catch (error) {
      setDeleteError(
        getErrorMessage(error, 'Não foi possível carregar os dados do livro.'),
      );
      if (error instanceof ApiError) {
        setBlockedAccessionNumbers(error.accessionNumbers);
      }
      return false;
    } finally {
      setIsDeletingCopy(false);
    }
  }

  function applyApiErrors(error: ApiError) {
    const unmappedErrors: string[] = [];
    for (const { field, message } of error.errors) {
      const formField = mapBookRequestField(field);
      if (formField) {
        setError(formField, { type: 'server', message });
      } else {
        unmappedErrors.push(message);
      }
    }

    if (error.accessionNumbers.length > 0) {
      setBlockedAccessionNumbers(error.accessionNumbers);
      setCurrentStep(2);
      for (const accessionNumber of error.accessionNumbers) {
        const index = getValues('copies').findIndex(
          (copy) => copy.accessionNumber.trim() === accessionNumber.trim(),
        );
        if (index >= 0) {
          setError(`copies.${index}.accessionNumber`, {
            type: 'server',
            message: 'Este tombo já está cadastrado.',
          });
        }
      }
    }

    const messages = [...unmappedErrors];
    if (messages.length === 0 && error.errors.length === 0) {
      messages.push(error.message);
    }
    if (messages.length > 0) setSaveError(messages.join(' '));
  }

  async function handleSave(data: BookFormData) {
    if (!book) return;
    setIsSaving(true);
    setSaveError(null);
    setBlockedAccessionNumbers([]);
    clearErrors();
    try {
      await updateManagedBook(book.id, toUpdateBookRequest(data));
      for (const copy of data.copies) {
        if (copy.copyId !== undefined) continue;
        const fingerprint = JSON.stringify([
          copy.accessionNumber.trim(),
          copy.physicalLocation.trim(),
        ]);
        if (savedCopyFingerprints.has(fingerprint)) continue;
        await addManagedCopy(book.id, {
          accessionNumber: copy.accessionNumber.trim(),
          physicalLocation: copy.physicalLocation.trim(),
        });
        setSavedCopyFingerprints((current) =>
          new Set(current).add(fingerprint),
        );
      }
      onCopyDeleted();
      setLoadedBookId(null);
      onClose();
    } catch (error) {
      if (error instanceof ApiError) {
        applyApiErrors(error);
      } else {
        setSaveError(
          getErrorMessage(
            error,
            'Não foi possível carregar os dados do livro.',
          ),
        );
      }
    } finally {
      setIsSaving(false);
    }
  }

  async function handleContinue() {
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
      'coverImageUrl',
      'summary',
    ]);
    if (valid) setCurrentStep(2);
  }

  function handleClose() {
    if (isSaving || isDeletingCopy) return;
    reset(defaultValues);
    setBook(null);
    setCopies([]);
    setLoadedBookId(null);
    setLoadError(null);
    setCurrentStep(1);
    setSaveError(null);
    setBlockedAccessionNumbers([]);
    setCopyToDelete(null);
    setDeleteError(null);
    setSavedCopyFingerprints(new Set());
    onClose();
  }

  const lockedCopyIds = copies
    .filter((copy) => copy.status === 'ON_LOAN')
    .map((copy) => copy.id);

  return (
    <Modal
      isOpen={open}
      onClose={handleClose}
      title="Editar livro"
      size="full"
      header={
        <ol
          aria-label="Etapas da edição"
          className="mb-4 grid grid-cols-2 gap-3 border-b border-line pb-4"
        >
          {editSteps.map((step) => {
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
            onClick={() =>
              currentStep === 1 ? handleClose() : setCurrentStep(1)
            }
            disabled={isSaving || isDeletingCopy}
          >
            {currentStep === 1 ? 'Cancelar' : 'Voltar'}
          </Button>
          {currentStep === 1 ? (
            <Button
              key="continue"
              type="button"
              onClick={() => void handleContinue()}
              disabled={
                isLoadingBook ||
                Boolean(visibleLoadError) ||
                categories.length === 0
              }
            >
              Continuar
            </Button>
          ) : (
            <Button
              key="save"
              type="submit"
              form="edit-book-form"
              disabled={isSaving || isDeletingCopy}
              leftIcon={
                isSaving ? <Loader2 size={14} className="animate-spin" /> : null
              }
            >
              {isSaving ? 'Salvando...' : 'Salvar alterações'}
            </Button>
          )}
        </div>
      }
    >
      {isLoadingBook ? (
        <LoadingState label="Carregando dados do livro" />
      ) : visibleLoadError ? (
        <EmptyState
          title="Não foi possível carregar o livro."
          description={visibleLoadError}
        />
      ) : book ? (
        <EditBookForm
          methods={methods}
          currentStep={currentStep}
          lockedCopyIds={lockedCopyIds}
          saveError={saveError}
          blockedAccessionNumbers={blockedAccessionNumbers}
          copyToDelete={copyToDelete}
          deleteError={deleteError}
          isDeletingCopy={isDeletingCopy}
          categories={categories}
          categoriesLoading={categoriesLoading}
          categoriesError={categoriesError}
          onRetryCategories={onRetryCategories}
          onCategoryCreated={onCategoryCreated}
          onRemoveExistingCopy={(copyId) => {
            const copy = copies.find((item) => item.id === copyId);
            if (copy && copy.status !== 'ON_LOAN') {
              setCopyToDelete(copy);
              setDeleteError(null);
              setBlockedAccessionNumbers([]);
            }
          }}
          onCancelCopyDeletion={() => setCopyToDelete(null)}
          onConfirmCopyDeletion={(copyId) => void handleDeleteCopy(copyId)}
          onSubmit={handleSave}
        />
      ) : null}
    </Modal>
  );
}
