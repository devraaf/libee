import { Button } from '../../../shared/components/ui/Button';
import { Input } from '../../../shared/components/ui/Input';
import { PasswordInput } from '../../../shared/components/ui/PasswordInput';
import { RadioGroup } from '../../../shared/components/ui/RadioGroup';
import { Select } from '../../../shared/components/ui/Select';
import { useAuthForm } from '../hooks/useAuthForm';
import { registerSchema } from '../schemas/auth.schema';
import {
  affiliationTypes,
  type AffiliationType,
} from '../../../shared/schemas/enums.schema';
import type { Course } from '../types/course';
import type { RegisterFormData } from '../schemas/auth.schema';

const initialValues = {
  name: '',
  phone: '',
  affiliationType: '',
  courseId: '',
  email: '',
  password: '',
  confirmPassword: '',
};

const affiliationTypeLabels: Record<AffiliationType, string> = {
  STUDENT: 'Estudante',
  EMPLOYEE: 'Funcionário',
  PROFESSOR: 'Professor',
};

interface RegisterFormProps {
  courses?: Course[];
  onSubmit?: (data: RegisterFormData) => void | Promise<void>;
}

export function RegisterForm({ courses = [], onSubmit }: RegisterFormProps) {
  const {
    formData,
    errors,
    formError,
    isLoading,
    handleFieldChange,
    handleSubmit,
  } = useAuthForm(initialValues, registerSchema, onSubmit);

  return (
    <form
      noValidate
      onSubmit={handleSubmit}
      className="flex w-full flex-col gap-4"
    >
      <Input
        name="name"
        label="Nome completo"
        placeholder="ex. Maria da Silva"
        autoComplete="name"
        maxLength={254}
        value={formData.name}
        onChange={(e) => handleFieldChange('name', e.target.value)}
        error={errors.name}
      />
      <Input
        name="phone"
        type="tel"
        label="Telefone"
        placeholder="(11) 99999-9999"
        autoComplete="tel"
        maxLength={15}
        value={formData.phone}
        onChange={(e) => handleFieldChange('phone', e.target.value)}
      />
      <RadioGroup
        legend="Tipo de vínculo"
        name="affiliationType"
        options={affiliationTypes.map((value) => ({
          value,
          label: affiliationTypeLabels[value],
        }))}
        value={formData.affiliationType}
        onChange={(value) => {
          handleFieldChange('affiliationType', value);
          if (value !== 'STUDENT') handleFieldChange('courseId', '');
        }}
        error={errors.affiliationType}
      />
      {formData.affiliationType === 'STUDENT' && (
        <Select
          name="courseId"
          label="Curso"
          value={formData.courseId}
          onChange={(e) => handleFieldChange('courseId', e.target.value)}
          options={courses.map((course) => ({
            value: String(course.id),
            label: course.name,
          }))}
          error={errors.courseId}
        />
      )}
      <Input
        name="email"
        type="email"
        label="E-mail"
        placeholder="seu.email@exemplo.com"
        autoComplete="email"
        maxLength={254}
        value={formData.email}
        onChange={(e) => handleFieldChange('email', e.target.value)}
        error={errors.email}
      />
      <PasswordInput
        name="password"
        label="Senha"
        placeholder="Mínimo de 8 caracteres"
        autoComplete="new-password"
        maxLength={70}
        value={formData.password}
        onChange={(e) => handleFieldChange('password', e.target.value)}
        error={errors.password}
      />
      <PasswordInput
        name="confirmPassword"
        label="Confirmar Senha"
        placeholder="Repita sua senha"
        autoComplete="new-password"
        maxLength={70}
        value={formData.confirmPassword}
        onChange={(e) => handleFieldChange('confirmPassword', e.target.value)}
        error={errors.confirmPassword}
      />
      {formError && (
        <p className="type-small text-danger" role="alert">
          {formError}
        </p>
      )}
      <Button
        type="submit"
        size="lg"
        fullWidth
        className="mt-2"
        disabled={isLoading}
      >
        {isLoading ? 'Cadastrando...' : 'Cadastrar'}
      </Button>
    </form>
  );
}
