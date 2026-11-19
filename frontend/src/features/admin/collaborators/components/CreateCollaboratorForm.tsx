import { useEffect, useId, useState, type FormEvent } from 'react';
import { Button } from '../../../../shared/components/ui/Button';
import {
  createCollaboratorSchema,
  maskPhone,
  roleLabels,
  type CollaboratorFormValues,
  type CollaboratorRole,
} from '../types/collaborator.model';

interface CreateCollaboratorFormProps {
  initialData?: CollaboratorFormValues;
  submitLabel?: string;
  submittingLabel?: string;
  onCancel: () => void;
  onSubmit?: (values: CollaboratorFormValues) => void | Promise<void>;
}

type FormState = Omit<CollaboratorFormValues, 'role'> & {
  role: CollaboratorRole | '';
};
type FormErrors = Partial<Record<keyof CollaboratorFormValues, string>>;

const emptyValues: FormState = {
  name: '',
  email: '',
  phone: '',
  role: '',
};

const roleOptions = Object.keys(roleLabels) as CollaboratorRole[];

const inputClass =
  'w-full rounded-lg border border-line bg-surface px-3 py-2 text-sm text-fg placeholder:text-subtle focus:border-primary focus:outline-none';
const labelClass = 'mb-1 block type-label text-fg';
const errorClass = 'mt-1 type-caption text-danger';

export default function CreateCollaboratorForm({
  initialData,
  submitLabel = 'Confirmar',
  submittingLabel = 'Salvando...',
  onCancel,
  onSubmit,
}: CreateCollaboratorFormProps) {
  const id = useId();
  const [values, setValues] = useState<FormState>(initialData ?? emptyValues);
  const [errors, setErrors] = useState<FormErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    setValues(initialData ?? emptyValues);
    setErrors({});
    setFormError(null);
  }, [initialData]);

  const setField = <K extends keyof FormState>(field: K, value: FormState[K]) =>
    setValues((current) => ({ ...current, [field]: value }));

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFormError(null);

    const result = createCollaboratorSchema.safeParse(values);

    if (!result.success) {
      const formattedErrors: FormErrors = {};
      result.error.issues.forEach((issue) => {
        const fieldName = issue.path[0] as
          | keyof CollaboratorFormValues
          | undefined;
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
          : 'Não foi possível salvar o colaborador.',
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
      <div>
        <label htmlFor={`${id}-name`} className={labelClass}>
          Nome
        </label>
        <input
          id={`${id}-name`}
          type="text"
          autoFocus
          placeholder="Ex: Maria Clara Almeida"
          value={values.name}
          onChange={(e) => setField('name', e.target.value)}
          className={inputClass}
        />
        {errors.name && <p className={errorClass}>{errors.name}</p>}
      </div>

      <div>
        <label htmlFor={`${id}-email`} className={labelClass}>
          E-mail
        </label>
        <input
          id={`${id}-email`}
          type="email"
          placeholder="exemplo@fatec.sp.gov.br"
          value={values.email}
          onChange={(e) => setField('email', e.target.value)}
          className={inputClass}
        />
        {errors.email && <p className={errorClass}>{errors.email}</p>}
      </div>

      <div>
        <label htmlFor={`${id}-phone`} className={labelClass}>
          Telefone
        </label>
        <input
          id={`${id}-phone`}
          type="tel"
          placeholder="(11) 99999-9999"
          value={values.phone}
          onChange={(e) => setField('phone', maskPhone(e.target.value))}
          className={inputClass}
        />
        {errors.phone && <p className={errorClass}>{errors.phone}</p>}
      </div>

      <fieldset>
        <legend className={labelClass}>Perfil de acesso</legend>
        <div className="flex flex-wrap items-center gap-4 type-small text-muted">
          {roleOptions.map((role) => (
            <label
              key={role}
              className="flex cursor-pointer items-center gap-1.5"
            >
              <input
                type="radio"
                name={`${id}-role`}
                value={role}
                checked={values.role === role}
                onChange={() => setField('role', role)}
                className="accent-primary"
              />
              {roleLabels[role]}
            </label>
          ))}
        </div>
        {errors.role && <p className={errorClass}>{errors.role}</p>}
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