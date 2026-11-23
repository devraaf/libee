import { useId, useState, type FormEvent } from 'react';
import { Button } from '../../../../shared/components/ui/Button';
import { Input } from '../../../../shared/components/ui/Input';
import { Select } from '../../../../shared/components/ui/Select';
import { maskPhone, normalizePhone } from '@/shared/utils/format-phone';
import {
  bondLabels,
  createReaderSchema,
  type ReaderBond,
  type ReaderFormValues,
} from '../types/reader.model';

interface CreateReaderFormProps {
  onCancel: () => void;
  onSubmit?: (values: ReaderFormValues) => void | Promise<void>;
  courseOptions?: string[];
}

type FormState = Omit<ReaderFormValues, 'bond'> & { bond: ReaderBond | '' };
type FormErrors = Partial<Record<keyof ReaderFormValues, string>>;

const initialValues: FormState = {
  name: '',
  email: '',
  phone: '',
  bond: '',
  course: '',
};

const bondOptions = Object.keys(bondLabels) as ReaderBond[];

const labelClass = 'mb-1 block type-label text-fg';
const errorClass = 'mt-1 type-caption text-danger';

export default function CreateReaderForm({
  onCancel,
  onSubmit,
  courseOptions = [],
}: CreateReaderFormProps) {
  const id = useId();
  const [values, setValues] = useState<FormState>(initialValues);
  const [errors, setErrors] = useState<FormErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isStudent = values.bond === 'student';

  const setField = <K extends keyof FormState>(field: K, value: FormState[K]) =>
    setValues((current) => ({ ...current, [field]: value }));

  const handleBondChange = (bond: ReaderBond) =>
    setValues((current) => ({
      ...current,
      bond,
      course: bond === 'student' ? current.course : '',
    }));

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFormError(null);

    const result = createReaderSchema.safeParse(values);

    if (!result.success) {
      const formattedErrors: FormErrors = {};
      result.error.issues.forEach((issue) => {
        const fieldName = issue.path[0] as keyof ReaderFormValues | undefined;
        if (!fieldName || formattedErrors[fieldName]) return;
        formattedErrors[fieldName] =
          fieldName === 'bond' ? 'Selecione o tipo de vínculo.' : issue.message;
      });
      setErrors(formattedErrors);
      return;
    }

    setErrors({});
    setIsSubmitting(true);
    try {
      await onSubmit?.({
        ...result.data,
        phone: normalizePhone(result.data.phone),
      });
      onCancel();
    } catch (error) {
      setFormError(
        error instanceof Error
          ? error.message
          : 'Não foi possível cadastrar o leitor.',
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
      <Input
        id={`${id}-name`}
        type="text"
        density="compact"
        label="Nome"
        autoFocus
        value={values.name}
        onChange={(e) => setField('name', e.target.value)}
        error={errors.name}
      />

      <Input
        id={`${id}-email`}
        type="email"
        density="compact"
        label="E-mail"
        value={values.email}
        onChange={(e) => setField('email', e.target.value)}
        error={errors.email}
      />

      <Input
        id={`${id}-phone`}
        type="tel"
        density="compact"
        label="Telefone"
        placeholder="(11) 99999-9999"
        value={values.phone}
        onChange={(e) => setField('phone', maskPhone(e.target.value))}
        error={errors.phone}
      />

      <fieldset>
        <legend className={labelClass}>Tipo vínculo</legend>
        <div className="flex flex-wrap items-center gap-4 type-small text-muted">
          {bondOptions.map((bond) => (
            <label
              key={bond}
              className="flex cursor-pointer items-center gap-1.5"
            >
              <input
                type="radio"
                name={`${id}-bond`}
                value={bond}
                checked={values.bond === bond}
                onChange={() => handleBondChange(bond)}
                className="accent-primary"
              />
              {bondLabels[bond]}
            </label>
          ))}
        </div>
        {errors.bond && <p className={errorClass}>{errors.bond}</p>}
      </fieldset>

      {isStudent && (
        <Select
          id={`${id}-course`}
          label="Curso"
          density="compact"
          value={values.course}
          onChange={(e) => setField('course', e.target.value)}
          placeholder="Selecione"
          options={courseOptions.map((course) => ({
            value: course,
            label: course,
          }))}
          error={errors.course}
        />
      )}

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
          {isSubmitting ? 'Cadastrando...' : 'Confirmar'}
        </Button>
      </div>
    </form>
  );
}
