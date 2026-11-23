import { useState } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Check, Loader2 } from 'lucide-react';
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
import { RegisterBookForm } from './RegisterBookForm';
import {
  mapBookRequestField,
  toRegisterBookRequest,
} from '../utils/book-form.mapper';
import { getErrorMessage } from '../../shared/utils/error-message';

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

function toFormYear(year: number | null): string {
  return year ? String(year) : '';
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

  const { setValue, control, reset, setError, clearErrors, trigger } = methods;

  const isbnValue = useWatch({ control, name: 'isbn' }) ?? '';

  const handleResetModal = () => {
    reset();
    setCurrentStep(1);
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
        setValue('publicationDate', toFormYear(book.publicationYear));
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
          message: `${getErrorMessage(error, 'Não foi possível consultar este ISBN.')} Você pode continuar e preencher os dados manualmente.`,
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
          message: getErrorMessage(
            error,
            'Não foi possível consultar este ISBN.',
          ),
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
      <RegisterBookForm
        methods={methods}
        currentStep={currentStep}
        isSearchingIsbn={isSearchingIsbn}
        blockedAccessionNumbers={blockedAccessionNumbers}
        suggestedCategory={suggestedCategory}
        isbnNotice={isbnNotice}
        categories={categories}
        categoriesLoading={categoriesLoading}
        categoriesError={categoriesError}
        onRetryCategories={onRetryCategories}
        onCategoryCreated={onCategoryCreated}
        onSearchIsbn={() => void handleNextFromStep1()}
        onSubmit={onSubmit}
      />
    </Modal>
  );
}
