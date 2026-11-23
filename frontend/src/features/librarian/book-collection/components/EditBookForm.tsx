import type { UseFormReturn } from 'react-hook-form';
import { FormProvider } from 'react-hook-form';
import { AlertCircle } from 'lucide-react';
import { Button } from '@/shared/components/ui/Button';
import type { Category, Copy } from '@/shared/types/library';
import type { BookFormData, BookFormInput } from '../schemas/book.schema';
import { BookCopiesFields } from './BookCopiesFields';
import { BookDataFields } from './BookDataFields';

interface EditBookFormProps {
  methods: UseFormReturn<BookFormInput, unknown, BookFormData>;
  currentStep: 1 | 2;
  lockedCopyIds: number[];
  saveError: string | null;
  blockedAccessionNumbers: string[];
  copyToDelete: Copy | null;
  deleteError: string | null;
  isDeletingCopy: boolean;
  categories: Category[];
  categoriesLoading: boolean;
  categoriesError: string | null;
  onRetryCategories: () => void;
  onCategoryCreated: (category: Category) => void;
  onRemoveExistingCopy: (copyId: number) => void;
  onCancelCopyDeletion: () => void;
  onConfirmCopyDeletion: (copyId: number) => void;
  onSubmit: (data: BookFormData) => Promise<void>;
}

export function EditBookForm({
  methods,
  currentStep,
  lockedCopyIds,
  saveError,
  blockedAccessionNumbers,
  copyToDelete,
  deleteError,
  isDeletingCopy,
  categories,
  categoriesLoading,
  categoriesError,
  onRetryCategories,
  onCategoryCreated,
  onRemoveExistingCopy,
  onCancelCopyDeletion,
  onConfirmCopyDeletion,
  onSubmit,
}: EditBookFormProps) {
  const {
    handleSubmit,
    formState: { errors },
  } = methods;

  return (
    <FormProvider {...methods}>
      <form
        id="edit-book-form"
        onSubmit={handleSubmit(onSubmit)}
        className="mx-auto w-full max-w-3xl space-y-4"
      >
        {saveError && (
          <div
            className="flex items-start gap-2 rounded-lg border border-danger-line bg-danger-bg p-3 text-xs text-danger"
            role="alert"
          >
            <AlertCircle size={16} className="mt-0.5 shrink-0" />
            <div>
              <p>{saveError}</p>
              {blockedAccessionNumbers.length > 0 && (
                <p className="mt-1">
                  Tombos em conflito: {blockedAccessionNumbers.join(', ')}
                </p>
              )}
            </div>
          </div>
        )}

        {currentStep === 1 && (
          <BookDataFields
            categories={categories}
            categoriesLoading={categoriesLoading}
            categoriesError={categoriesError}
            onRetryCategories={onRetryCategories}
            onCategoryCreated={onCategoryCreated}
          />
        )}

        {currentStep === 2 && (
          <div className="rounded-xl border border-line p-4 sm:p-6">
            <p className="type-caption mb-4 text-muted">
              Os tombos existentes são mantidos. Atualize suas localizações,
              adicione novos exemplares ou remova os que não estão emprestados.
            </p>
            <BookCopiesFields
              lockedCopyIds={lockedCopyIds}
              removingCopyId={isDeletingCopy ? copyToDelete?.id : null}
              onRemoveExistingCopy={onRemoveExistingCopy}
            />
          </div>
        )}

        {errors.root?.server && (
          <p className="type-small text-danger" role="alert">
            {errors.root.server.message}
          </p>
        )}

        {copyToDelete && (
          <div className="flex flex-col gap-3 rounded-lg border border-danger/30 bg-danger-bg p-4">
            <p className="type-small text-fg">
              Confirma a exclusão do exemplar{' '}
              <strong className="font-mono">
                {copyToDelete.accessionNumber}
              </strong>
              ? Esta ação não pode ser desfeita.
            </p>
            {deleteError && (
              <div className="type-small text-danger" role="alert">
                <p>{deleteError}</p>
                {blockedAccessionNumbers.length > 0 && (
                  <p className="mt-1">
                    Tombos bloqueados: {blockedAccessionNumbers.join(', ')}
                  </p>
                )}
              </div>
            )}
            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={onCancelCopyDeletion}
                disabled={isDeletingCopy}
              >
                Cancelar
              </Button>
              <Button
                type="button"
                onClick={() => onConfirmCopyDeletion(copyToDelete.id)}
                disabled={isDeletingCopy}
              >
                {isDeletingCopy ? 'Excluindo...' : 'Confirmar exclusão'}
              </Button>
            </div>
          </div>
        )}
      </form>
    </FormProvider>
  );
}
