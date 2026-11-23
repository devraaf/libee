import { useRef, useState, type FormEvent } from 'react';
import { z } from 'zod';
import { ApiError } from '@/shared/api/api-error';

type StringFormValues = Record<string, string>;

export function useAuthForm<
  TValues extends StringFormValues,
  TSchema extends z.ZodType,
>(
  initialValues: TValues,
  schema: TSchema,
  onValidSubmit?: (data: z.output<TSchema>) => void | Promise<void>,
) {
  const [formData, setFormData] = useState<TValues>(initialValues);
  const [errors, setErrors] = useState<Partial<Record<keyof TValues, string>>>(
    {},
  );
  const [formError, setFormError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const isSubmitting = useRef(false);

  function handleFieldChange(field: keyof TValues, value: string) {
    setFormData((previous) => ({ ...previous, [field]: value }));
    setErrors((previous) => ({ ...previous, [field]: undefined }));
    setFormError(null);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isSubmitting.current) return;
    isSubmitting.current = true;

    try {
      const result = schema.safeParse(formData);
      if (!result.success) {
        const nextErrors: Partial<Record<keyof TValues, string>> = {};
        for (const issue of result.error.issues) {
          const field = issue.path[0];
          if (
            typeof field === 'string' &&
            Object.prototype.hasOwnProperty.call(initialValues, field)
          ) {
            const formField = field as keyof TValues;
            if (!nextErrors[formField]) {
              nextErrors[formField] = issue.message;
            }
          }
        }
        setErrors(nextErrors);
        return;
      }

      setIsLoading(true);
      try {
        await onValidSubmit?.(result.data);
        setFormData(initialValues);
        setErrors({});
        setFormError(null);
      } catch (error) {
        if (error instanceof ApiError && error.status === 400) {
          const fieldErrors: Partial<Record<keyof TValues, string>> = {};
          const unmappedErrors: string[] = [];

          error.errors.forEach(({ field, message }) => {
            if (Object.prototype.hasOwnProperty.call(initialValues, field)) {
              const formField = field as keyof TValues;
              fieldErrors[formField] ??= message;
            } else {
              unmappedErrors.push(message);
            }
          });

          setErrors((previous) => ({ ...previous, ...fieldErrors }));
          setFormError(
            unmappedErrors.length > 0
              ? unmappedErrors.join(' ')
              : error.errors.length > 0
                ? null
                : error.message,
          );
        } else {
          setFormError(
            error instanceof Error
              ? error.message
              : 'Não foi possível concluir a operação. Tente novamente.',
          );
        }
      }
    } finally {
      isSubmitting.current = false;
      setIsLoading(false);
    }
  }

  return {
    formData,
    errors,
    formError,
    isLoading,
    handleFieldChange,
    handleSubmit,
  };
}
