import type { UseFormReturn } from 'react-hook-form';
import { FormProvider } from 'react-hook-form';
import { AlertCircle, Loader2, Search } from 'lucide-react';
import { Button } from '@/shared/components/ui/Button';
import { Input } from '@/shared/components/ui/Input';
import type { Category } from '@/shared/types/library';
import type {
  RegisterBookFormData,
  RegisterBookFormInput,
} from '../schemas/book.schema';
import { BookCopiesFields } from './BookCopiesFields';
import { BookDataFields } from './BookDataFields';

interface RegisterBookFormProps {
  methods: UseFormReturn<RegisterBookFormInput, unknown, RegisterBookFormData>;
  currentStep: 1 | 2 | 3;
  isSearchingIsbn: boolean;
  blockedAccessionNumbers: string[];
  suggestedCategory: string;
  isbnNotice: {
    type: 'warning' | 'existing';
    message: string;
  } | null;
  categories: Category[];
  categoriesLoading: boolean;
  categoriesError: string | null;
  onRetryCategories: () => void;
  onCategoryCreated: (category: Category) => void;
  onSearchIsbn: () => void;
  onSubmit: (data: RegisterBookFormData) => Promise<void>;
}

export function RegisterBookForm({
  methods,
  currentStep,
  isSearchingIsbn,
  blockedAccessionNumbers,
  suggestedCategory,
  isbnNotice,
  categories,
  categoriesLoading,
  categoriesError,
  onRetryCategories,
  onCategoryCreated,
  onSearchIsbn,
  onSubmit,
}: RegisterBookFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = methods;

  return (
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
              <h3 className="type-label text-fg">Encontre a obra pelo ISBN</h3>
              <p className="type-caption mt-1 text-muted">
                A busca consulta a API e preenche os dados disponíveis para você
                revisar.
              </p>
            </div>
            <div className="flex flex-col gap-2 justify-between sm:flex-row">
              <Input
                {...register('isbn')}
                type="text"
                density="compact"
                label="ISBN (10 ou 13 dígitos) *"
                placeholder="ex: 9786500000001"
                containerClassName="flex-1"
                error={errors.isbn?.message}
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="sm:self-end"
                onClick={onSearchIsbn}
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
          <>
            {isbnNotice?.type === 'warning' && (
              <div className="flex items-center gap-2 rounded-lg border border-info-line bg-info-bg p-3 text-xs text-info">
                <AlertCircle size={16} className="shrink-0" />
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

            <BookDataFields
              categories={categories}
              categoriesLoading={categoriesLoading}
              categoriesError={categoriesError}
              onRetryCategories={onRetryCategories}
              onCategoryCreated={onCategoryCreated}
            />
          </>
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
  );
}
