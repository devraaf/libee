import { useFieldArray, useFormContext } from 'react-hook-form';
import { Plus, Trash2 } from 'lucide-react';
import type {
  RegisterBookFormData,
  RegisterBookFormInput,
} from '../schemas/book.schema';

export function BookCopiesFields() {
  const {
    control,
    register,
    formState: { errors },
  } = useFormContext<RegisterBookFormInput, unknown, RegisterBookFormData>();
  const { fields, append, remove } = useFieldArray({
    control,
    name: 'copies',
  });

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold text-fg">Exemplares da obra</h3>
        <button
          type="button"
          onClick={() => append({ accessionNumber: '', physicalLocation: '' })}
          className="flex items-center gap-1 text-xs font-semibold text-primary hover:text-primary-hover"
        >
          <Plus size={14} /> Adicionar exemplar
        </button>
      </div>

      {errors.copies?.root?.message && (
        <p className="text-xs text-danger" role="alert">
          {errors.copies.root.message}
        </p>
      )}

      {fields.map((field, index) => (
        <div
          key={field.id}
          className="relative flex flex-col gap-3 rounded-lg border border-line bg-surface-warm p-3"
        >
          <div className="flex items-center justify-between">
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
              <label
                htmlFor={`copy-${index}-accession`}
                className="mb-1 block text-xs font-semibold text-fg"
              >
                Tombo (Nº de Registro) *
              </label>
              <input
                id={`copy-${index}-accession`}
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
              <label
                htmlFor={`copy-${index}-location`}
                className="mb-1 block text-xs font-semibold text-fg"
              >
                Localização Física *
              </label>
              <input
                id={`copy-${index}-location`}
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
  );
}
