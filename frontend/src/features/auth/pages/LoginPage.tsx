import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Logo } from '../../../shared/components/branding/Logo';
import { AuthLayout } from '../components/AuthLayout';
import { LoginForm } from '../components/LoginForm';
import type { LoginFormData } from '../schemas/auth.schema';
import { login, type AuthSession } from '../services/auth.service';

interface LoginPageProps {
  onSubmit?: (data: LoginFormData) => AuthSession | Promise<AuthSession>;
}

export function LoginPage({ onSubmit }: LoginPageProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const registrationSuccess = location.state?.registrationSuccess === true;

  async function handleLogin(data: LoginFormData) {
    const session = onSubmit ? await onSubmit(data) : await login(data);
    const homePath =
      session.user.profile === 'LIBRARIAN'
        ? '/gerenciamento/acervo'
        : '/acervo';

    navigate(homePath);
  }
  return (
    <AuthLayout>
      <Logo heightClassName="h-36" />
      <p className="type-small text-fg">Entre com sua conta para continuar</p>
      {registrationSuccess && (
        <p className="type-small text-ok" role="status">
          Cadastro realizado com sucesso. Entre com sua conta para continuar.
        </p>
      )}
      <LoginForm onSubmit={handleLogin} />
      <p className="type-small text-muted">
        Não possui uma conta?{' '}
        <Link to="/cadastro" className="text-primary hover:underline">
          Cadastre-se
        </Link>
      </p>
    </AuthLayout>
  );
}
