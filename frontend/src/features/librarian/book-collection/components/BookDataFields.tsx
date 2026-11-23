import { useState, type ChangeEvent } from 'react';
import { useFormContext, useWatch } from 'react-hook-form';
import type { Category } from '@/shared/types/library';
import { Button } from '@/shared/components/ui/Button';
import { IconButton } from '@/shared/components/ui/IconButton';
import { Input } from '@/shared/components/ui/Input';
import { Textarea } from '@/shared/components/ui/Textarea';
import type { BookFormData, BookFormInput } from '../schemas/book.schema';
import { BookCategoryField } from './BookCategoryField';

interface BookDataFieldsProps {
  categories: Category[];
  categoriesLoading: boolean;
  categoriesError: string | null;
  onRetryCategories: () => void;
  onCategoryCreated: (category: Category) => void;
}

export function BookDataFields({
  categories,
  categoriesLoading,
  categoriesError,
  onRetryCategories,
  onCategoryCreated,
}: BookDataFieldsProps) {
  const [authorInput, setAuthorInput] = useState('');
  const [authorError, setAuthorError] = useState('');
  const {
    register,
    setValue,
    control,
    clearErrors,
    formState: { errors },
  } = useFormContext<BookFormInput, unknown, BookFormData>();
  const authors = useWatch({ control, name: 'authors' }) ?? [];
  const selectedCategoryId = useWatch({ control, name: 'categoryId' }) ?? 0;

  function handlePublicationYear(event: ChangeEvent<HTMLInputElement>) {
    const value = event.target.value.replace(/\D/g, '').slice(0, 4);
    setValue('publicationDate', value, {
      shouldValidate: true,
      shouldDirty: true,
    });
  }

  function handleAddAuthor() {
    const author = authorInput.trim();
    if (!author) {
      setAuthorError('Digite o nome do autor antes de adicionar.');
      return;
    }
    if (
      authors.some(
        (existing) =>
          existing.toLocaleLowerCase() === author.toLocaleLowerCase(),
      )
    ) {
      setAuthorError('Este autor já foi adicionado.');
      return;
    }

    setValue('authors', [...authors, author], { shouldValidate: true });
    setAuthorInput('');
    setAuthorError('');
    clearErrors('authors');
  }

  function handleRemoveAuthor(indexToRemove: number) {
    setValue(
      'authors',
      authors.filter((_, index) => index !== indexToRemove),
      { shouldValidate: true },
    );
  }

  return (
    <div className="flex flex-col gap-5 rounded-xl border border-line p-4 sm:p-6">
      <div>
        <h3 className="type-label text-fg">Dados bibliográficos</h3>
        <p className="type-caption mt-1 text-muted">
          Revise os dados do livro e complete as informações obrigatórias.
        </p>
      </div>

      <Input
        id="book-isbn"
        {...register('isbn')}
        type="text"
        label="ISBN"
        error={errors.isbn?.message}
        className="bg-surface-warm"
      />

      <Input
        id="book-title"
        {...register('title')}
        type="text"
        label="Título *"
        placeholder="Título da obra"
        error={errors.title?.message}
      />

      <div>
        <label htmlFor="book-author" className="mb-1 block type-label text-fg">
          Autores
        </label>
        <div className="mb-2 flex flex-wrap gap-1.5">
          {authors.map((author, index) => (
            <span
              key={`${author}-${index}`}
              className="inline-flex items-center gap-1 rounded-md bg-chip px-2.5 py-1 type-caption font-medium text-fg"
            >
              {author}
              <IconButton
                type="button"
                label={`Remover autor ${author}`}
                icon={<span aria-hidden="true">×</span>}
                size="sm"
                variant="ghost"
                onClick={() => handleRemoveAuthor(index)}
                className="size-5 text-muted hover:text-danger"
              />
            </span>
          ))}
        </div>
        <div className="flex gap-2">
          <Input
            id="book-author"
            aria-label="Nome do autor"
            type="text"
            value={authorInput}
            onChange={(event) => {
              setAuthorInput(event.target.value);
              setAuthorError('');
            }}
            onKeyDown={(event) => {
              if (event.key === 'Enter') {
                event.preventDefault();
                handleAddAuthor();
              }
            }}
            placeholder="Nome do autor"
            containerClassName="flex-1"
          />
          <Button type="button" variant="outline" onClick={handleAddAuthor}>
            Adicionar
          </Button>
        </div>
        {(authorError || errors.authors) && (
          <span className="mt-1 block type-caption text-danger">
            {authorError || errors.authors?.message}
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
        <Input
          id="book-publisher"
          {...register('publisher')}
          type="text"
          label="Editora"
          placeholder="Editora"
          error={errors.publisher?.message}
        />
        <Input
          id="book-publication-place"
          {...register('publicationPlace')}
          type="text"
          label="Local"
          placeholder="Local de publicação"
          error={errors.publicationPlace?.message}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Input
          id="book-edition"
          {...register('edition')}
          type="text"
          label="Edição"
          placeholder="ex: 1ª"
          error={errors.edition?.message}
        />
        <Input
          id="book-publication-date"
          {...register('publicationDate')}
          type="text"
          label="Publicação"
          inputMode="numeric"
          maxLength={4}
          onChange={handlePublicationYear}
          placeholder="ex: 2025"
          error={errors.publicationDate?.message}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Input
          id="book-page-count"
          {...register('pageCount')}
          type="number"
          label="Páginas"
          placeholder="300"
          error={errors.pageCount?.message}
        />
        <Input
          id="book-cover-image"
          {...register('coverImageUrl')}
          type="text"
          label="URL da capa"
          placeholder="https://imagem-capa"
          error={errors.coverImageUrl?.message}
        />
      </div>

      <Textarea
        id="book-summary"
        {...register('summary')}
        rows={3}
        label="Resumo (Opcional)"
        placeholder="Resumo da obra..."
        error={errors.summary?.message}
      />
    </div>
  );
}
