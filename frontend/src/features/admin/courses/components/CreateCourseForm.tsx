import { useEffect, useId, useState, type FormEvent } from 'react';
import { Button } from '../../../../shared/components/ui/Button';
import {
  createCourseSchema,
  statusLabels,
  type CourseFormValues,
  type CourseStatus,
} from '../types/course.model';

interface CreateCourseFormProps {
  initialData?: CourseFormValues;
  submitLabel?: string;
  submittingLabel?: string;
  onCancel: () => void;
  onSubmit?: (values: CourseFormValues) => void | Promise<void>;
}

type FormErrors = Partial<Record<keyof CourseFormValues, string>>;

const initialValues: CourseFormValues = {
  name: '',
  status: 'active',
};

const statusOptions = Object.keys(statusLabels) as CourseStatus[];

const inputClass =
  'w-full rounded-lg border border-line bg-surface px-3 py-2 text-sm text-fg placeholder:text-subtle focus:border-primary focus:outline-none';
const labelClass = 'mb-1 block type-label text-fg';
const errorClass = 'mt-1 type-caption text-danger';

export default function CreateCourseForm({
  initialData,
  submitLabel = 'Confirmar',
  submittingLabel = 'Salvando...',
  onCancel,
  onSubmit,
}: CreateCourseFormProps) {
  const id = useId();
  const [values, setValues] = useState<CourseFormValues>(
    initialData ?? initialValues,
  );
  const [errors, setErrors] = useState<FormErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    setValues(initialData ?? initialValues);
    setErrors({});
    setFormError(null);
  }, [initialData]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFormError(null);

    const result = createCourseSchema.safeParse(values);

    if (!result.success) {
      const formattedErrors: FormErrors = {};
      result.error.issues.forEach((issue) => {
        const fieldName = issue.path[0] as keyof CourseFormValues | undefined;
        if (!fieldName || formattedErrors[fieldName]) return;
        formattedErrors[fieldName] = issue.message;
      });
      setErrors(formattedErrors);
      return;
    }

    setErrors({});
    setIsSubmitting(true);
    try {
      await onSubmit?.(result.data);
      onCancel();
    } catch (error) {
      setFormError(
        error instanceof Error
          ? error.message
          : 'Não foi possível salvar o curso.',
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
      <div>
        <label htmlFor={`${id}-name`} className={labelClass}>
          Nome do curso
        </label>
        <input
          id={`${id}-name`}
          type="text"
          autoFocus
          placeholder="Ex: Desenvolvimento de Software Multiplataforma"
          value={values.name}
          onChange={(e) =>
            setValues((current) => ({ ...current, name: e.target.value }))
          }
          className={inputClass}
        />
        {errors.name && <p className={errorClass}>{errors.name}</p>}
      </div>

      <fieldset>
        <legend className={labelClass}>Status</legend>
        <div className="flex flex-wrap items-center gap-4 type-small text-muted">
          {statusOptions.map((status) => (
            <label
              key={status}
              className="flex cursor-pointer items-center gap-1.5"
            >
              <input
                type="radio"
                name={`${id}-status`}
                value={status}
                checked={values.status === status}
                onChange={() =>
                  setValues((current) => ({ ...current, status }))
                }
                className="accent-primary"
              />
              {statusLabels[status]}
            </label>
          ))}
        </div>
        {errors.status && <p className={errorClass}>{errors.status}</p>}
      </fieldset>

      {formError && (
        <p className={errorClass} role="alert">
          {formError}
        </p>
      )}

      <div className="flex justify-end gap-3 pt-2">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={isSubmitting}
        >
          Cancelar
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? submittingLabel : submitLabel}
        </Button>
      </div>
    </form>
  );
}