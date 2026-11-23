import { useState } from 'react';
import { useFieldArray, useFormContext } from 'react-hook-form';
import { Plus, Sparkles, Trash2 } from 'lucide-react';
import { Button } from '@/shared/components/ui/Button';
import { IconButton } from '@/shared/components/ui/IconButton';
import { Input } from '@/shared/components/ui/Input';
import type { BookFormData, BookFormInput } from '../schemas/book.schema';
import { generateCopySuggestions } from '../utils/generate-copy-suggestions';

interface BookCopiesFieldsProps {
  lockedCopyIds?: number[];
  removingCopyId?: number | null;
  onRemoveExistingCopy?: (copyId: number) => void;
}

export function BookCopiesFields({
  lockedCopyIds = [],
  removingCopyId = null,
  onRemoveExistingCopy,
}: BookCopiesFieldsProps) {
  const {
    control,
    getValues,
    register,
    setValue,
    formState: { errors },
  } = useFormContext<BookFormInput, unknown, BookFormData>();
  const { fields, append, remove } = useFieldArray({
    control,
    name: 'copies',
  });
  const [copyQuantity, setCopyQuantity] = useState(fields.length || 1);
  const [defaultLocation, setDefaultLocation] = useState('');
  const [generationError, setGenerationError] = useState<string | null>(null);

  function handleGenerateCopySuggestions() {
    const copies = getValues('copies');
    const result = generateCopySuggestions(
      copies,
      copyQuantity,
      defaultLocation,
      fields.length,
    );
    if (typeof result === 'string') {
      setGenerationError(result);
      return;
    }

    const suggestions = [...result.suggestions];
    for (const emptyCopyIndex of result.emptyCopyIndexes) {
      const generatedCopy = suggestions.shift();
      if (!generatedCopy) {
        break;
      }
      setValue(
        `copies.${emptyCopyIndex}.accessionNumber`,
        generatedCopy.accessionNumber,
        { shouldDirty: true, shouldValidate: true },
      );
      setValue(
        `copies.${emptyCopyIndex}.physicalLocation`,
        generatedCopy.physicalLocation,
        { shouldDirty: true, shouldValidate: true },
      );
    }

    if (suggestions.length > 0) {
      append(suggestions);
    }

    setGenerationError(null);
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h3 className="type-label text-fg">Exemplares da obra</h3>
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={() => append({ accessionNumber: '', physicalLocation: '' })}
          leftIcon={<Plus size={14} aria-hidden="true" />}
        >
          Adicionar exemplar
        </Button>
      </div>

      <div className="rounded-lg border border-line bg-surface-warm p-3">
        <div className="grid gap-3 sm:grid-cols-[minmax(0,0.7fr)_minmax(0,1.3fr)_auto] sm:items-end">
          <Input
            id="copy-quantity"
            type="number"
            min={1}
            label="Quantidade de cópias"
            value={copyQuantity}
            onChange={(event) => setCopyQuantity(Number(event.target.value))}
          />
          <Input
            id="copy-default-location"
            type="text"
            label="Localização física padrão"
            placeholder="Usa a primeira preenchida"
            value={defaultLocation}
            onChange={(event) => setDefaultLocation(event.target.value)}
          />
          <Button
            type="button"
            variant="outline"
            onClick={handleGenerateCopySuggestions}
            leftIcon={<Sparkles size={14} aria-hidden="true" />}
          >
            Gerar exemplares
          </Button>
        </div>
        <p className="type-caption mt-2 text-muted">
          Os tombos serão sugeridos em sequência e continuarão editáveis.
        </p>
        {generationError && (
          <p className="type-caption mt-2 text-danger" role="alert">
            {generationError}
          </p>
        )}
      </div>

      {errors.copies?.root?.message && (
        <p className="type-caption text-danger" role="alert">
          {errors.copies.root.message}
        </p>
      )}

      {fields.map((field, index) => (
        <div
          key={field.id}
          className="relative flex flex-col gap-3 rounded-lg border border-line bg-surface-warm p-3"
        >
          <div className="flex items-center justify-between">
            <span className="type-caption font-semibold text-fg">
              Exemplar {index + 1}
            </span>
            <IconButton
              type="button"
              label={
                typeof field.copyId === 'number'
                  ? 'Excluir exemplar'
                  : `Remover exemplar ${index + 1}`
              }
              icon={<Trash2 size={14} aria-hidden="true" />}
              variant="ghost"
              size="sm"
              onClick={() => {
                if (typeof field.copyId === 'number') {
                  onRemoveExistingCopy?.(field.copyId);
                } else {
                  remove(index);
                }
              }}
              title={
                typeof field.copyId === 'number' &&
                lockedCopyIds.includes(field.copyId)
                  ? 'Exemplares com empréstimo ativo não podem ser excluídos.'
                  : undefined
              }
              disabled={
                (typeof field.copyId === 'number' &&
                  lockedCopyIds.includes(field.copyId)) ||
                (typeof field.copyId === 'number' &&
                  removingCopyId === field.copyId)
              }
              className="text-fg hover:text-danger"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Input
                id={`copy-${index}-accession`}
                {...register(`copies.${index}.accessionNumber`)}
                type="text"
                label={`Tombo do exemplar ${index + 1} *`}
                placeholder="ex: 0090"
                readOnly={typeof field.copyId === 'number'}
                error={errors.copies?.[index]?.accessionNumber?.message}
              />
            </div>
            <div>
              <Input
                id={`copy-${index}-location`}
                {...register(`copies.${index}.physicalLocation`)}
                type="text"
                label={`Localização Física do exemplar ${index + 1} *`}
                placeholder="ex: Estante A-01"
                error={errors.copies?.[index]?.physicalLocation?.message}
              />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
