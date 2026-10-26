import { Button } from '../../../shared/components/ui/Button';
import { Input } from '../../../shared/components/ui/Input';
import { PasswordInput } from '../../../shared/components/ui/PasswordInput';
import { useAuthForm } from '../hooks/useAuthForm';
import { loginSchema } from '../schemas/auth.schema';
import type { LoginFormData } from '../schemas/auth.schema';

const initialValues = {
  email: '',
  password: '',
};

interface LoginFormProps {
  onSubmit?: (data: LoginFormData) => void | Promise<void>;
}

export function LoginForm({ onSubmit }: LoginFormProps) {
  const { formData, errors, isLoading, handleFieldChange, handleSubmit } =
    useAuthForm(initialValues, loginSchema, onSubmit);

  return (
    <form
      noValidate
      onSubmit={handleSubmit}
      className="flex w-full flex-col gap-4"
    >
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
        autoComplete="current-password"
        maxLength={70}
        value={formData.password}
        onChange={(e) => handleFieldChange('password', e.target.value)}
        error={errors.password}
      />
      <Button
        type="submit"
        size="lg"
        fullWidth
        className="mt-2"
        disabled={isLoading}
      >
        {isLoading ? 'Entrando...' : 'Entrar'}
      </Button>
    </form>
  );
}
