import { Link } from 'react-router-dom';
import { Logo } from '../../../shared/components/branding/Logo';
import { AuthLayout } from '../components/AuthLayout';
import { LoginForm } from '../components/LoginForm';
import type { LoginFormData } from '../schemas/auth.schema';

interface LoginPageProps {
  onSubmit?: (data: LoginFormData) => void | Promise<void>;
}

export function LoginPage({ onSubmit }: LoginPageProps) {
  return (
    <AuthLayout>
      <Logo heightClassName="h-36" />
      <p className="type-small text-fg">Entre com sua conta para continuar</p>
      <LoginForm onSubmit={onSubmit} />
      <p className="type-small text-muted">
        Não possui uma conta?{' '}
        <Link to="/cadastro" className="text-primary hover:underline">
          Cadastre-se
        </Link>
      </p>
    </AuthLayout>
  );
}
